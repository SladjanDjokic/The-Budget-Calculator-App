import { Service } from '../Service';
import ITriggerService, { GroupedUserActions } from './ITriggerService';
import UserService from '../user/user.service';
import { ObjectUtils } from '../../utils/utils';
import { RsError } from '../../utils/errors';
import IUserPointService, { UserPointCreate } from '../userPoint/IUserPointService';
import ICampaignService from '../campaign/ICampaignService';
import ISystemActionLogService from '../systemActionLog/ISystemActionLogService';
import IActionService from '../action/IActionService';
import IUserCompletedCampaignService from '../userCompletedCampaign/IUserCompletedCampaignService';
import { ServiceName } from '../serviceFactory';
import CampaignService from '../campaign/campaign.service';
import ActionService from '../action/action.service';
import UserPointService from '../userPoint/userPoint.service';
import UserCompletedCampaignService from '../userCompletedCampaign/userCompletedCampaign.service';
import SystemActionLogService from '../systemActionLog/systemActionLog.service';

export default class TriggerService extends Service implements ITriggerService {
	campaignService: ICampaignService;
	userService: UserService;
	actionService: IActionService;
	userPointService: IUserPointService;
	userCompletedCampaignService: IUserCompletedCampaignService;
	systemActionLogService: ISystemActionLogService;
	constructor() {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.campaignService = services['CampaignService'] as CampaignService;
		this.userService = services['UserService'] as UserService;
		this.actionService = services['ActionService'] as ActionService;
		this.userPointService = services['UserPointService'] as UserPointService;
		this.userCompletedCampaignService = services['UserCompletedCampaignService'] as UserCompletedCampaignService;
		this.systemActionLogService = services['SystemActionLogService'] as SystemActionLogService;
	}

	/**
	 * FireActionForUser - Sets user action details and writes into userAction
	 * @param userId
	 * @param actionId
	 * @param companyId
	 * @returns {boolean} - whether or not the actions were successful.
	 */
	async fireActionForUser(userId: number, actionId: number, companyId?: number): Promise<boolean> {
		const actionDetails: Api.Action.Res.Details = await this.actionService.getDetailsById(actionId, companyId);
		const existingUserActions: Model.UserAction[] = await this.userService.getUserActionsByUserId(userId);
		const campaignActionIds: number[] = this.getAvailableCampaignActionIds(actionDetails, existingUserActions);
		if (!ObjectUtils.isArrayWithData(campaignActionIds))
			throw new RsError(
				'BAD_REQUEST',
				`Action has exceeded all available campaign action counts (actionId: ${actionId})`
			);
		await this.userService.createManyUserActions(userId, campaignActionIds);
		await this.campaignService.consolidateUserCampaigns(userId, companyId);
		await this.checkForCompletedCampaigns(actionDetails.campaigns, userId);
		this.logTriggerActions(userId, campaignActionIds);
		return true;
	}

	async refundActionForUser(
		userId: number,
		campaignAction: Model.CampaignAction,
		companyId?: number
	): Promise<boolean> {
		const userActions = await this.userService.getUserActionsByUserId(userId);
		userActions.sort((action1, action2) => action2.id - action1.id);
		const actionToRefund = userActions.find(
			(userAction) => userAction.campaignActionId === campaignAction.id && !userAction.refundedOn
		);
		const refundedAction = await this.userService.refundUserAction(actionToRefund.id);
		if (!!!refundedAction.refundedOn) {
			throw new RsError('REFUND_FAILURE', `Failed to refund action for user action ${actionToRefund.id}`);
		}

		const revokedPoints: Model.UserPoint = await this.userPointService.create({
			userId,
			campaignActionId: campaignAction.id,
			status: 'REVOKED',
			reason: 'TRANSACTION_REFUND',
			pointAmount: campaignAction.pointValue,
			pointType: 'CAMPAIGN',
			notes: 'REFUND FOR OFFSITE TRANSACTION'
		});
		if (!revokedPoints) {
			throw new RsError('BAD_REQUEST', 'REFUND TRANSACTION POINTS FAILED');
		}
		await this.systemActionLogService.systemLog(
			this.systemActionLogService.formatLogItem({
				userId,
				action: 'POINT_ADJUSTMENT',
				source: 'campaignAction',
				sourceId: campaignAction.id
			})
		);

		const actionDetails: Api.Action.Res.Details = await this.actionService.getDetailsById(
			campaignAction.actionId,
			companyId
		);
		await this.checkForCompletedCampaigns(actionDetails.campaigns, userId);
		return true;
	}

	private getAvailableCampaignActionIds(
		actionDetails: Api.Action.Res.Details,
		existingUserActions: Model.UserAction[]
	): number[] {
		const groupedUserActions: GroupedUserActions = this.groupUserActions(existingUserActions);
		const validIds: number[] = [];
		for (let campaign of actionDetails.campaigns) {
			if (!campaign.campaignActionId) continue;
			if (groupedUserActions[campaign.campaignActionId] >= campaign.actionCount) continue;
			validIds.push(campaign.campaignActionId);
		}
		return validIds;
	}

	private groupUserActions(userActions: Model.UserAction[]): GroupedUserActions {
		const groupedActions: GroupedUserActions = {};
		for (let userAction of userActions) {
			if (!groupedActions[userAction.campaignActionId]) {
				groupedActions[userAction.campaignActionId] = 1;
				continue;
			}
			groupedActions[userAction.campaignActionId]++;
		}
		return groupedActions;
	}

	private async logTriggerActions(userId: number, campaignActionIds: number[]): Promise<void> {
		for (let sourceId of campaignActionIds) {
			await this.systemActionLogService.systemLog({
				userId,
				action: 'TRIGGER',
				source: 'campaignAction',
				sourceId
			});
		}
	}

	private async checkForCompletedCampaigns(campaigns: Api.Action.Res.CampaignDetails[], userId: number) {
		const userActions: Model.UserAction[] = await this.userService.getUserActionsByUserId(userId);
		for (let campaign of campaigns) {
			const fullCampaign: Api.Campaign.Detail = await this.campaignService.getById(campaign.id);
			let campaignCompleted = true;
			fullCampaign.actions.forEach((action) => {
				const actionsToCompare = userActions.filter(
					(userAction) => userAction.campaignActionId === action.campaignActionId && !userAction.refundedOn
				);
				if (ObjectUtils.isArrayWithData(actionsToCompare) && actionsToCompare.length >= action.actionCount)
					return;
				campaignCompleted = false;
			});
			if (campaignCompleted) {
				const completedCampaign = await this.userService.createUserCompletedCampaign(campaign.id, userId);
				if (completedCampaign) {
					const pointObj: UserPointCreate = {
						campaignId: completedCampaign.campaignId,
						pointAmount: completedCampaign.completionPoints,
						pointType: 'CAMPAIGN',
						reason: 'CAMPAIGN_COMPLETION',
						status: 'RECEIVED',
						userId
					};
					await this.userPointService.create(pointObj);
				}
			} else {
				const previouslyCompletedCampaign = await this.userCompletedCampaignService.getCompletedCampaignForUser(
					campaign.id,
					userId
				);
				if (previouslyCompletedCampaign) {
					const pointObj: UserPointCreate = {
						campaignId: previouslyCompletedCampaign.campaignId,
						pointAmount: previouslyCompletedCampaign.completionPoints,
						pointType: 'CAMPAIGN',
						reason: 'TRANSACTION_REFUND',
						status: 'REVOKED',
						userId
					};
					await this.userPointService.create(pointObj);
					await this.userCompletedCampaignService.refund(previouslyCompletedCampaign.campaignId);
				}
			}
		}
	}
}
