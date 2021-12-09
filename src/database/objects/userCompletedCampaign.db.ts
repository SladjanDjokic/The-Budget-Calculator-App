import Table from '../Table';
import IUserCompletedCampaignTable from '../interfaces/IUserCompletedCampaign';
import { DateUtils } from '../../utils/utils';

export default class UserCompletedCampaign extends Table implements IUserCompletedCampaignTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getById(campaignId: number, userId: number): Promise<Api.UserCampaign.Res.Get> {
		return this.db.queryOne(
			`SELECT ucc.*, campaign.completionPoints
                                 FROM userCompletedCampaign ucc
                                          LEFT JOIN campaign
                                                    ON userCompletedCampaign.campaignId = campaign.id
                                 WHERE campaignId = ?
                                   AND userId = ?`,
			[campaignId, userId]
		);
	}

	async getByUserId(userId: number): Promise<Api.UserCampaign.Res.Get[]> {
		return this.db.runQuery(
			`SELECT ucc.*, campaign.completionPoints
                                 FROM userCompletedCampaign ucc
                                          LEFT JOIN campaign
                                                    ON userCompletedCampaign.campaignId = campaign.id
                                 WHERE userId = ?`,
			[userId]
		);
	}

	refund(id: number): Promise<Api.UserCampaign.Res.Get> {
		this.db.runQuery('UPDATE userCompletedCampaign SET refundedOn = ? id = ?;', [DateUtils.dbNow(), id]);
		return this.db.queryOne('SELECT * FROM userCompletedCampaign WHERE id = ?', [id]);
	}
}

export const userCompletedCampaign = (dbArgs) => {
	dbArgs.tableName = 'userCompletedCampaign';
	return new UserCompletedCampaign(dbArgs);
};
