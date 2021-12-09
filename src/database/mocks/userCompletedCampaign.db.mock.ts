import TableMock from './table.db.mock';
import IUserCompletedCampaignTable from '../interfaces/IUserCompletedCampaign';
import ICampaignTable from '../interfaces/ICampaignTable';
import { DateUtils } from '../../utils/utils';

export default class UserCompletedCampaignTableMock extends TableMock implements IUserCompletedCampaignTable {
	columns: string[];
	constructor(
		public completedCampaigns: Api.UserCampaign.Res.Get[] = [],
		private readonly campaignTable: ICampaignTable
	) {
		super();
	}

	async create(userId: number, campaignId: number): Promise<Api.UserCampaign.Res.Get> {
		let campaign = await this.campaignTable.getById(campaignId);
		const userCompletedCampaign: Api.UserCampaign.Res.Get = {
			id: 1,
			campaignId,
			completionPoints: campaign.completionPoints,
			createdOn: '',
			hasAwarded: 1,
			modifiedOn: '',
			userId,
			refundedOn: null
		};
		this.completedCampaigns.push(userCompletedCampaign);
		return userCompletedCampaign;
	}

	async getById(campaignId: number, userId: number): Promise<Api.UserCampaign.Res.Get> {
		return this.completedCampaigns.find((a) => a.userId === userId && a.campaignId === campaignId);
	}
	async getByUserId(userId: number): Promise<Api.UserCampaign.Res.Get[]> {
		return this.completedCampaigns.filter((campaign) => campaign.userId === userId);
	}

	async refund(id: number): Promise<Api.UserCampaign.Res.Get> {
		let index = this.completedCampaigns.findIndex((campaign) => campaign.campaignId === id);
		this.completedCampaigns[index].refundedOn = DateUtils.dbNow();
		return this.completedCampaigns[index];
	}
}
