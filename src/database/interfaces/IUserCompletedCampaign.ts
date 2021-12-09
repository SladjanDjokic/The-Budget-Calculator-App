import ITable from '../ITable';

export interface UserCampaignCreate {
	userId: number;
	campaignId: number;
}

export default interface IUserCompletedCampaignTable extends ITable {
	create: (userId: number, campaignId: number) => Promise<Api.UserCampaign.Res.Get>;
	getByUserId: (userId: number) => Promise<Api.UserCampaign.Res.Get[]>;
	getById: (campaignId: number, userId: number) => Promise<Api.UserCampaign.Res.Get>;
	refund: (id: number) => Promise<Api.UserCampaign.Res.Get>;
}
