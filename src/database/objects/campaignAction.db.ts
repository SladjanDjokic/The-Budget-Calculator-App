import Table from '../Table';
import mysql from 'mysql';
import logger from '../../utils/logger';
import ICampaignActionTable from '../interfaces/ICampaignActionTable';

export default class CampaignAction extends Table implements ICampaignActionTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async createManyActionsForCampaign(
		campaignId: number,
		actionList: Api.CampaignAction.CreateMany[]
	): Promise<Model.CampaignAction[]> {
		const queryString: string = this.createManyQueryString(campaignId, actionList);
		const createdCampaignActions = await this.db.runQuery(queryString);
		logger.info(createdCampaignActions);
		return null;
	}

	async getByCampaignId(campaignId: number): Promise<Model.CampaignAction[]> {
		return await this.db.runQuery(`SELECT * FROM campaignAction WHERE campaignId=? ;`, [campaignId]);
	}

	async getByActionId(actionId: number): Promise<Model.CampaignAction[]> {
		return await this.db.runQuery('SELECT * FROM campaignAction WHERE actionId=?;', [actionId]);
	}

	async getActiveByIds(ids: number[]): Promise<Model.CampaignAction[]> {
		return this.db.runQuery('SELECT * FROM campaignAction WHERE id IN (?) AND isActive=TRUE', [ids]);
	}

	private createManyQueryString(campaignId: number, actionList: Api.CampaignAction.CreateMany[]): string {
		let queryList = [];
		for (let action of actionList) {
			queryList.push(
				mysql.format('INSERT INTO campaignAction SET ?;', [
					{
						campaignId,
						actionId: action.actionId,
						actionCount: action.actionCount || 1
					}
				])
			);
		}
		return queryList.join('');
	}
}

export const campaignAction = (dbArgs) => {
	dbArgs.tableName = 'campaignAction';
	return new CampaignAction(dbArgs);
};
