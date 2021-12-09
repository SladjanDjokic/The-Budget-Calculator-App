import { Service } from '../Service';
import IUserCompletedCampaignTable from '../../database/interfaces/IUserCompletedCampaign';
import { ServiceName } from '../serviceFactory';

export default class UserCompletedCampaignService extends Service {
	constructor(private readonly userCompletedCampaign: IUserCompletedCampaignTable) {
		super();
	}
	start(services: Partial<Record<ServiceName, Service>>) {}

	getCompletedCampaignForUser(campaignId: number, userId: number): Promise<Api.UserCampaign.Res.Get> {
		return this.userCompletedCampaign.getById(campaignId, userId);
	}

	refund(id: number): Promise<Api.UserCampaign.Res.Get> {
		return this.userCompletedCampaign.refund(id);
	}
}
