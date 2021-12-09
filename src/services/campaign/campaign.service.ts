import { Service } from '../Service';
import ICampaignTable from '../../database/interfaces/ICampaignTable';
import { CampaignToCreate } from '../../database/objects/campaign.db';
import ICampaignActionTable from '../../database/interfaces/ICampaignActionTable';
import { DateUtils, ObjectUtils } from '../../utils/utils';
import { RsError } from '../../utils/errors';
import UserService from '../user/user.service';
import SystemActionLogService from '../systemActionLog/systemActionLog.service';
import UserPointService from '../userPoint/userPoint.service';
import ICampaignService, {
	AwardPoints,
	CampaignActionCount,
	CampaignActionValue,
	CampaignUpdate
} from './ICampaignService';
import { ServiceName } from '../serviceFactory';

export default class CampaignService extends Service implements ICampaignService {
	userService: UserService;
	userPointService: UserPointService;
	systemActionLogService: SystemActionLogService;
	constructor(readonly campaignTable: ICampaignTable, readonly campaignActionTable: ICampaignActionTable) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.userService = services['UserService'] as UserService;
		this.userPointService = services['UserPointService'] as UserPointService;
		this.userPointService.start({ UserService: this.userService });
		this.systemActionLogService = services['SystemActionLogService'] as SystemActionLogService;
	}

	async create({ actions, ...objToCreate }: CampaignToCreate): Promise<Api.Campaign.Detail> {
		const createdCampaign: Model.Campaign = await this.campaignTable.create(objToCreate);
		await this.createManyCampaignActions(objToCreate.companyId, createdCampaign.id, actions);
		return await this.getById(createdCampaign.id, createdCampaign.companyId);
	}

	async update(campaignId: number, { actions, ...objToUpdate }: CampaignUpdate): Promise<Api.Campaign.Detail> {
		const updatedCampaign: Api.Campaign.Detail = await this.campaignTable.update(
			campaignId,
			{ id: campaignId, ...objToUpdate },
			objToUpdate.companyId
		);
		if (!actions || !ObjectUtils.isArrayWithData(actions)) return updatedCampaign;
		await this.updateCampaignActions(campaignId, actions);
		return await this.campaignTable.getById(campaignId, updatedCampaign.companyId);
	}

	getById(campaignId: number, companyId?: number): Promise<Api.Campaign.Detail> {
		return this.campaignTable.getById(campaignId, companyId);
	}

	getManyByIds(campaignIds: number[], companyId: number): Promise<Api.Campaign.Detail[]> {
		return this.campaignTable.getManyByIds(campaignIds, companyId);
	}

	getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId: number
	): Promise<RedSky.RsPagedResponseData<Api.Campaign.Detail>> {
		return this.campaignTable.getByPage(pagination, sort, filter, companyId);
	}

	async delete(campaignId: number, companyId: number): Promise<number> {
		await this.campaignTable.deactivate(campaignId, companyId);
		return campaignId;
	}

	async createManyCampaignActions(
		companyId: number,
		campaignId: number,
		actionList: Api.CampaignAction.CreateMany[]
	): Promise<Model.CampaignAction[]> {
		if (!ObjectUtils.isArrayWithData(actionList))
			throw new RsError('BAD_REQUEST', 'Missing actionList in create campaign actions');
		return await this.campaignActionTable.createManyActionsForCampaign(campaignId, actionList);
	}

	getByCompanyId(companyId: number): Promise<Api.Campaign.Detail[]> {
		return this.campaignTable.getByCompanyId(companyId);
	}

	getColumns(): string[] {
		return this.campaignTable.columns;
	}

	/**
	 * ConsolidateUserCampaigns - Will consolidate userActions relative to campaigns and award points associated
	 * @param userId
	 */
	async consolidateUserCampaigns(userId: number, companyId: number): Promise<void> {
		const usersActions: Model.UserAction[] = await this.userService.getUserActionsByUserId(userId);
		const campaignActionIds: number[] = this.getCampaignActionIds(usersActions);
		const usersCampaignActions: Model.CampaignAction[] = await this.campaignActionTable.getActiveByIds(
			campaignActionIds
		);
		const usersCampaignActionCount: CampaignActionCount = this.getCampaignActionCount(
			usersActions,
			usersCampaignActions
		);
		const usersCampaignDetails: Api.Campaign.Detail[] = await this.getManyForCampaignActionIds(
			campaignActionIds,
			companyId
		);
		const userPointsToAward: AwardPoints[] = this.consolidateToAwardPoints(
			usersCampaignDetails,
			usersCampaignActionCount
		);
		await this.awardCampaignPoints(userId, companyId, userPointsToAward);
		await this.updateUserActions(userId, userPointsToAward);
	}

	getManyForCampaignActionIds(campaignActionIds: number[], companyId: number): Promise<Api.Campaign.Detail[]> {
		return this.campaignTable.getManyForCampaignActionIds(campaignActionIds, companyId);
	}

	async getActiveCampaignsByCompanyId(companyId: number): Promise<Api.Campaign.Detail[]> {
		const campaigns = await this.getByCompanyId(companyId);
		return campaigns.filter((campaign) => {
			if (
				campaign.isActive &&
				(campaign.startOn <= DateUtils.dbNow() || !campaign.startOn) &&
				(campaign.endOn >= DateUtils.dbNow() || !campaign.endOn)
			)
				return campaign;
		});
	}

	getCampaignActionsByActionId(actionId: number, companyId: number): Promise<Model.CampaignAction[]> {
		return this.campaignActionTable.getByActionId(actionId);
	}

	getByCampaignActionId(campaignActionId: number): Promise<Model.CampaignAction> {
		return this.campaignActionTable.getById(campaignActionId);
	}

	private async updateCampaignActions(campaignId: number, actions: Api.CampaignAction.CreateMany[]): Promise<void> {
		const currentCampaignActions: Model.CampaignAction[] = await this.campaignActionTable.getByCampaignId(
			campaignId
		);
		const currentCampaignActionMap: { [key: number]: Model.CampaignAction } = ObjectUtils.toObject(
			currentCampaignActions,
			'actionId'
		);
		for (let action of actions) {
			if (currentCampaignActionMap[action.actionId]) {
				let tableObj: Api.CampaignAction.CreateMany = { actionId: action.actionId, isActive: 1 };
				if (action.actionCount) tableObj.actionCount = action.actionCount;
				await this.campaignActionTable.update(currentCampaignActionMap[action.actionId].id, tableObj);
			} else await this.campaignActionTable.create({ campaignId, ...action });
			delete currentCampaignActionMap[action.actionId];
		}
		for (const [key, value] of Object.entries(currentCampaignActionMap)) {
			await this.campaignActionTable.update(value.id, { isActive: 0 });
		}
	}

	private async awardCampaignPoints(userId: number, companyId: number, userPointsToAward: AwardPoints[]) {
		const awardedPoints: Model.UserPoint[] = [];
		for (let userPoints of userPointsToAward) {
			const points: Model.UserPoint = await this.userPointService.create({
				userId,
				pointType: 'CAMPAIGN',
				pointAmount: userPoints.campaignPointsToAward,
				reason: 'CAMPAIGN_ACTION',
				status: 'RECEIVED',
				campaignActionId: userPoints.campaignActionId
			});
			awardedPoints.push(points);
			await this.systemActionLogService.systemLog(
				this.systemActionLogService.formatLogItem({
					userId,
					method: '',
					originalUrl: '',
					action: 'CAMPAIGN_CONSOLIDATION',
					source: 'campaignAction',
					sourceId: userPoints.campaignActionId,
					metaData: { ...userPoints }
				})
			);
		}
		return awardedPoints;
	}

	private async updateUserActions(userId: number, userPointsToAward: AwardPoints[]): Promise<void> {
		for (let userPoints of userPointsToAward) {
			await this.userService.updateManyUserActionsById(userId, userPoints.userActionIds);
		}
	}

	private getCampaignActionIds(usersActions: Model.UserAction[]): number[] {
		return usersActions.reduce((accumulator, action) => {
			if (action.hasAwarded || accumulator.includes(action.campaignActionId)) return [...accumulator];
			return [...accumulator, action.campaignActionId];
		}, []);
	}

	private getCampaignActionCount(
		usersActions: Model.UserAction[],
		usersCampaignActions: Model.CampaignAction[]
	): CampaignActionCount {
		const objectActions = {};
		for (let action of usersActions) {
			if (action.hasAwarded) continue;
			if (!objectActions[action.campaignActionId]) {
				objectActions[action.campaignActionId] = {
					...usersCampaignActions.find((userAction) => userAction.id === action.campaignActionId),
					userCampaignActionCount: 1,
					userActionIds: [action.id]
				};
				continue;
			}
			objectActions[action.campaignActionId].userCampaignActionCount++;
			objectActions[action.campaignActionId].userActionIds.push(action.id);
		}
		return objectActions;
	}

	private consolidateToAwardPoints(
		usersCampaignDetails: Api.Campaign.Detail[],
		usersCampaignActionCount: CampaignActionCount
	): AwardPoints[] {
		const awardPoints = [];
		for (let campaignActionId in usersCampaignActionCount) {
			const userCampaignAction: CampaignActionValue = usersCampaignActionCount[campaignActionId];
			if (userCampaignAction.actionCount < userCampaignAction.userCampaignActionCount) continue;
			const campaignDetails = usersCampaignDetails.find((campaign) => {
				return campaign.id === userCampaignAction.campaignId;
			});
			const actionDetails = campaignDetails.actions.find((action) => {
				return action.id === userCampaignAction.actionId;
			});
			awardPoints.push({
				campaignActionId: userCampaignAction.id,
				campaignPointsToAward: this.getPoints(campaignDetails, actionDetails, userCampaignAction),
				campaignId: campaignDetails.id,
				actionId: actionDetails.id,
				userActionIds: userCampaignAction.userActionIds
			});
		}
		return awardPoints;
	}

	private getPoints(
		campaignDetails: Api.Campaign.Detail,
		actionDetails: Api.Campaign.Action,
		userCampaignAction: CampaignActionValue
	): number {
		const actionPoints = actionDetails.pointValue * userCampaignAction.userCampaignActionCount;
		if (actionPoints > campaignDetails.maxReward) return campaignDetails.maxReward;
		return actionPoints;
	}
}
