import Table from '../Table';
import mysql from 'mysql';
import { ObjectUtils } from '../../utils/utils';

export interface CampaignToCreate extends Api.Campaign.Req.Create {
	companyId: number;
}

export default class Campaign extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async create(campaignDetails: CampaignToCreate): Promise<Model.Campaign> {
		const createdCampaign = await this.db.runQuery('INSERT INTO campaign SET ?;', [campaignDetails]);
		return await this.db.queryOne('SELECT * FROM campaign WHERE id=?;', [createdCampaign.insertId]);
	}

	async deactivate(campaignId: number, companyId: number): Promise<void> {
		return await this.db.runQuery('UPDATE campaign SET isActive=0 WHERE id=? AND companyId=?', [
			campaignId,
			companyId
		]);
	}

	async getById(campaignId: number, companyId?: number): Promise<Api.Campaign.Detail> {
		const companyIdQuery = Campaign.buildCompanyIdQuery(companyId, 'campaign');
		return await this.db.queryOne(
			`SELECT campaign.*,
                    IFNULL(actions.actionList, '[]') actions
             FROM campaign
                      LEFT JOIN (
                 SELECT campaignAction.campaignId,
                        CONCAT('[',
                               GROUP_CONCAT(
                                       CONCAT(
                                               '{"id":', a.id,
                                               ',"campaignActionId":', campaignAction.id,
                                               ',"name":"', IFNULL(a.name, ''),
                                               '","description":"', IFNULL(a.description, ''),
                                               '","createdOn":"', a.createdOn,
                                               '","modifiedOn":"', a.modifiedOn,
                                               '","isActive":', a.isActive,
                                               ',"type":"', a.type,
                                               '","pointValue":', a.pointValue,
                                               ',"actionCount":', campaignAction.actionCount, '}'
                                           )
                                   ),
                               ']') actionList
                 FROM campaignAction
                          JOIN action a ON campaignAction.actionId = a.id
                 WHERE campaignAction.isActive = 1
                 GROUP BY campaignId) actions ON actions.campaignId = campaign.id
             WHERE campaign.id = ?
               AND ${companyIdQuery}
             GROUP BY campaign.id;`,
			[campaignId, companyId]
		);
	}

	async getManyByIds(campaignIdList: number[], companyId: number): Promise<Api.Campaign.Detail[]> {
		return await this.db.runQuery(
			`SELECT campaign.*, IFNULL(actions.actionList, '[]') actions
             FROM campaign
                      LEFT JOIN (
                 SELECT campaignAction.campaignId,
                        CONCAT('[',
                               GROUP_CONCAT(
                                       CONCAT('{' ||
                                              '"id":', a.id,
                                              ',"name":"', IFNULL(a.name, ''),
                                              '","description":"', IFNULL(a.description, ''),
                                              '","createdOn":"', a.createdOn,
                                              '","modifiedOn":"', a.modifiedOn,
                                              '","isActive":', a.isActive,
                                              ',"type":"', a.type,
                                              '","pointValue":', a.pointValue,
                                              '}')), ']') actionList
                 FROM campaignAction
                          JOIN action a ON campaignAction.actionId = a.id
                 WHERE campaignAction.isActive = 1
                 GROUP BY campaignId) actions ON actions.campaignId = campaign.id
             WHERE campaign.id IN (?)
               AND campaign.companyId = ?
             GROUP BY campaign.id;`,
			[campaignIdList, companyId]
		);
	}

	async getByCompanyId(companyId: number): Promise<Api.Campaign.Detail[]> {
		return await this.db.runQuery(
			`SELECT *
             FROM campaign
                      JOIN (
                 SELECT campaignAction.campaignId,
                        CONCAT('[',
                               GROUP_CONCAT(CONCAT('{"id":', action.id, ',"name":"', action.name, '","description":"',
                                                   IFNULL(action.description, ''), '","isActive":', action.isActive,
                                                   ',"type":"', action.type, '","pointValue":', action.pointValue,
                                                   ',"actionCount":', campaignAction.actionCount, '}')), ']') actions
                 FROM campaignAction
                          JOIN action ON campaignAction.actionId = action.id
                 WHERE campaignAction.isActive = 1
                 GROUP BY campaignAction.campaignId
             ) campaignActions ON campaign.id = campaignActions.campaignId
             WHERE (campaign.companyId = ? OR campaign.companyId = 0);`,
			[companyId]
		);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId: number
	): Promise<RedSky.RsPagedResponseData<Api.Campaign.Detail[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQueryString = companyId ? mysql.format(' companyId=? AND', [companyId]) : '';
		let allObjects = await this.db.runQuery(
			`SELECT campaign.*, IFNULL(actions.actionList, '[]') actions
             FROM campaign
                      LEFT JOIN (
                 SELECT campaignAction.campaignId,
                        CONCAT('[',
                               GROUP_CONCAT(CONCAT('{"id":', a.id, ',"name":"', IFNULL(a.name, ''), '","description":"',
                                                   IFNULL(a.description, ''), '","createdOn":"', a.createdOn,
                                                   '","modifiedOn":"', a.modifiedOn, '","isActive":', a.isActive,
                                                   ',"type":"', a.type, '","pointValue":', a.pointValue, '}')),
                               ']') actionList
                 FROM campaignAction
                          JOIN action a ON campaignAction.actionId = a.id
                 WHERE campaignAction.isActive = 1
                 GROUP BY campaignId) actions ON actions.campaignId = campaign.id
             WHERE campaign.isActive = 1
               AND ${companyIdQueryString} ${pageQuery.filterQuery} ${pageQuery.sortQuery}
                 LIMIT ?
             OFFSET ?;
            SELECT Count(id) as total
            FROM campaign
            WHERE ${companyIdQueryString} ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	async getManyForCampaignActionIds(campaignActionIds: number[], companyId: number): Promise<Api.Campaign.Detail[]> {
		return await this.db.runQuery(
			`SELECT campaign.*, IFNULL(actions.actionList, '[]') actions
             FROM campaign
                      JOIN campaignAction cA on campaign.id = cA.campaignId
                      LEFT JOIN (SELECT campaignAction.campaignId,
                                        CONCAT('[', GROUP_CONCAT(CONCAT('{"id":', a.id, ',"name":"', IFNULL(a.name, ''),
                                                                        '","description":"', IFNULL(a.description, ''),
                                                                        '","createdOn":"', a.createdOn,
                                                                        '","modifiedOn":"', a.modifiedOn,
                                                                        '","isActive":', a.isActive, ',"type":"',
                                                                        a.type, '","pointValue":', a.pointValue, '}')),
                                               ']') actionList
                                 FROM campaignAction
                                          JOIN action a ON campaignAction.actionId = a.id
                                 WHERE campaignAction.isActive = 1
                                 GROUP BY campaignId) actions ON actions.campaignId = campaign.id
             WHERE cA.id IN (?)
               AND cA.companyId = ?
             GROUP BY campaign.id;`,
			[campaignActionIds, companyId]
		);
	}
}

export const campaign = (dbArgs) => {
	dbArgs.tableName = 'campaign';
	return new Campaign(dbArgs);
};
