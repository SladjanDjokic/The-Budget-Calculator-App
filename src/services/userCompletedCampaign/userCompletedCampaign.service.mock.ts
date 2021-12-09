import IUserCompletedCampaignService from './IUserCompletedCampaignService';
import IUserCompletedCampaignTable from '../../database/interfaces/IUserCompletedCampaign';
import { DateUtils } from '../../utils/utils';

export default class UserCompletedCampaignServiceMock implements IUserCompletedCampaignService {
	constructor(private readonly userCompletedCampaignTable: IUserCompletedCampaignTable) {}
	start() {}

	getCompletedCampaignForUser(campaignId: number, userId: number): Promise<Api.UserCampaign.Res.Get> {
		return this.userCompletedCampaignTable.getById(campaignId, userId);
	}

	refund(id: number): Promise<Api.UserCampaign.Res.Get> {
		return this.userCompletedCampaignTable.refund(id);
	}
}
