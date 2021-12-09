import IService from '../IService';

export default interface IUserCompletedCampaignService extends IService {
	getCompletedCampaignForUser: (campaignId: number, userId: number) => Promise<Api.UserCampaign.Res.Get>;
	refund: (id: number) => Promise<Api.UserCampaign.Res.Get>;
}
