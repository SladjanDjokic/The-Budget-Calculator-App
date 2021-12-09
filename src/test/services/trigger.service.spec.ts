import triggerResource from '../resources/trigger.service.resource';
import ITriggerService from '../../services/trigger/ITriggerService';
import { expect } from 'chai';
import UserService from '../../services/user/user.service';
import IUserPointService from '../../services/userPoint/IUserPointService';

describe('TriggerService', function () {
	const triggerService: ITriggerService = triggerResource.triggerService;
	const userService: UserService = triggerResource.userService;
	const userPointService: IUserPointService = triggerResource.userPointService;
	describe('Fire Action', function () {
		let user: Api.User.Res.Detail;
		let afterUser: Api.User.Res.Detail;
		let createdCampaign: Model.CampaignAction;
		let userActions: Model.UserAction[];
		let completedCampaigns: Api.UserCampaign.Res.Get[];
		before(async () => {
			user = await triggerResource.userService.getUserDetails(triggerResource.user.id);
			await triggerService.fireActionForUser(
				triggerResource.user.id,
				triggerResource.campaignActions[0].id,
				triggerResource.companyId
			);
			afterUser = await userService.getUserDetails(triggerResource.user.id);
			createdCampaign = triggerResource.campaignActions[0];
			userActions = await triggerResource.userActionTable.getByUserId(triggerResource.user.id);
			completedCampaigns = await triggerResource.userCompletedCampaignTable.getByUserId(triggerResource.user.id);
		});
		it('should log an action and award points', function () {
			const createdAction = userActions.find(
				(action) => action.campaignActionId === triggerResource.campaignActions[0].id
			);
			expect(createdAction).to.exist;
			expect(afterUser.lifeTimePoints).to.be.greaterThan(user.lifeTimePoints);
		});
		it('should complete a campaign and award campaign points', function () {
			const newlyCompletedCampaign = completedCampaigns.find(
				(campaign) => campaign.campaignId === triggerResource.campaign.id
			);
			expect(newlyCompletedCampaign).to.exist;
		});
	});
	describe('Refund Action', function () {
		let user: Api.User.Res.Detail;
		let afterUser: Api.User.Res.Detail;
		let createdCampaign: Model.CampaignAction;
		let userPoints: Model.UserPoint[];
		let userActions: Model.UserAction[];
		let completedCampaigns: Api.UserCampaign.Res.Get[];
		before(async () => {
			user = await triggerResource.userService.getUserDetails(triggerResource.user.id);
			await triggerService.refundActionForUser(
				triggerResource.user.id,
				triggerResource.campaignActions[0],
				triggerResource.companyId
			);
			afterUser = await userService.getUserDetails(triggerResource.user.id);
			userPoints = await triggerResource.userPointService.getByUserId(triggerResource.user.id);
			createdCampaign = triggerResource.campaignActions[0];
			userActions = await triggerResource.userActionTable.getByUserId(triggerResource.user.id);
			completedCampaigns = await triggerResource.userCompletedCampaignTable.getByUserId(triggerResource.user.id);
		});
		it('should refund points from an action', function () {
			const refundedPoints = userPoints.find(
				(action) =>
					action.status === 'REVOKED' && action.campaignActionId === triggerResource.campaignActions[0].id
			);
			expect(refundedPoints).to.exist;
			expect(refundedPoints.status).to.equal('REVOKED');
			expect(afterUser.availablePoints).to.be.lessThan(user.availablePoints);
		});
		it('should refund an action from a completed campaign and refund campaign points', function () {
			const userPointRefund = userPoints.find((userPoint) => {
				return userPoint.campaignId === triggerResource.campaign.id && userPoint.status === 'REVOKED';
			});
			expect(userPointRefund).to.exist;
			const refundedCampaign = completedCampaigns.find(
				(campaign) => !!campaign.refundedOn && campaign.campaignId === userPointRefund.campaignId
			);
			expect(refundedCampaign).to.exist;
		});
	});
});
