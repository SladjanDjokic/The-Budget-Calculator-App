import Table from '../Table';
import mysql from 'mysql';
import { ObjectUtils } from '../../utils/utils';
import ITierTable from '../interfaces/ITierTable';

export default class Tier extends Table implements ITierTable {
	constructor(dbArgs) {
		super(dbArgs);
	}
	getAll(): Promise<Model.Tier[]> {
		return this.db.runQuery(`SELECT * FROM tier;`);
	}

	async getByCompanyId(companyId: number) {
		return this.db.runQuery(
			`SELECT
			    tier.*,
			   IFNULL(tfm.features, '[]') features
			FROM tier
				LEFT JOIN (SELECT tierId, CONCAT('[', GROUP_CONCAT(CONCAT('{"id":', tF.id, ',"companyId":', tF.companyId, ',"name":"', tF.name, '","createdOn":"', tF.createdOn, '","modifiedOn":"', tF.modifiedOn, '"}')), ']') features FROM tierFeatureMap JOIN tierFeature tF on tierFeatureMap.tierFeatureId = tF.id group by tierFeatureMap.tierId) tfm on tfm.tierId=tier.id
			WHERE companyId=?;`,
			[companyId]
		);
	}

	async getById(tierId: number) {
		return this.db.queryOne(
			`SELECT
			    tier.*,
			   IFNULL(tfm.features, '[]') features,
			   IFNULL(tierMedia.media, '${Table.mediaNotFoundObject}') AS media
			FROM tier
				LEFT JOIN (SELECT tierId, CONCAT('[', GROUP_CONCAT(CONCAT('{"id":', tF.id, ',"companyId":', tF.companyId, ',"name":"', tF.name, '","createdOn":"', tF.createdOn, '","modifiedOn":"', tF.modifiedOn, '"}')), ']') features FROM tierFeatureMap JOIN tierFeature tF on tierFeatureMap.tierFeatureId = tF.id group by tierFeatureMap.tierId) tfm on tfm.tierId=tier.id
				LEFT JOIN(
					SELECT mediaMap.tierId,
						CONCAT(
							'[',
							GROUP_CONCAT(
								CONCAT(
									'{"id":', id,
									',"uploaderId":', uploaderId,
									',"type":"', type,
									'","urls":', urls,
									',"title":"', IFNULL(title, ''),
									'","description":"', IFNULL(description, ''),
									'","isPrimary":', isPrimary, '}'
								)
							),
							']'
						) media
					FROM media
						JOIN mediaMap ON mediaMap.mediaId = media.id
					GROUP BY mediaMap.tierId
				) tierMedia ON tierMedia.tierId = tier.id
			WHERE tier.id=?;`,
			[tierId]
		);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId: number
	) {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQueryString = companyId ? mysql.format(' companyId=? AND', [companyId]) : '';
		let allObjects = await this.db.runQuery(
			`SELECT 
				tier.*,
				IFNULL(tfm.features, '[]') features,
				IFNULL(tierMedia.media, '${Table.mediaNotFoundObject}') AS media
			 FROM ${this.tableName}
				LEFT JOIN (SELECT tierId, CONCAT('[', GROUP_CONCAT(CONCAT('{"id":', tF.id, ',"companyId":', tF.companyId, ',"name":"', tF.name, '","createdOn":"', tF.createdOn, '","modifiedOn":"', tF.modifiedOn, '"}')), ']') features FROM tierFeatureMap JOIN tierFeature tF on tierFeatureMap.tierFeatureId = tF.id group by tierFeatureMap.tierId) tfm on tfm.tierId=tier.id
				LEFT JOIN(
					SELECT mediaMap.tierId,
						CONCAT(
							'[',
							GROUP_CONCAT(
								CONCAT(
									'{"id":', id,
									',"uploaderId":', uploaderId,
									',"type":"', type,
									'","urls":', urls,
									',"title":"', IFNULL(title, ''),
									'","description":"', IFNULL(description, ''),
									'","isPrimary":', isPrimary, '}'
								)
							),
							']'
						) media
						FROM media
						JOIN mediaMap ON mediaMap.mediaId = media.id
					GROUP BY mediaMap.tierId
				) tierMedia ON tierMedia.tierId = tier.id
			WHERE
			 ${companyIdQueryString}
			 ${pageQuery.filterQuery}
			 ${pageQuery.sortQuery} 
			 LIMIT ?
			 OFFSET ?; SELECT Count(id) as total FROM ${this.tableName} WHERE ${companyIdQueryString} ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	async addFeature(tierId: number, featureIdList: number[]) {
		const insertString: string = this.formatInsertString(tierId, featureIdList, 'tierFeatureMap');
		return await this.db.runQuery(insertString, []);
	}

	async deleteFeaturesForTier(tierId: number): Promise<boolean> {
		const deleted = await this.db.runQuery('DELETE FROM tierFeatureMap WHERE tierId=?;', [tierId]);
		return !!deleted.affectedRows;
	}

	private formatInsertString(tierId: number, featureIdList: number[], tableName: string = this.tableName): string {
		const resultList = [];
		for (let id of featureIdList) {
			resultList.push(mysql.format(`INSERT INTO ${tableName} SET ?;`, [{ tierId, tierFeatureId: id }]));
		}
		return resultList.join(' ');
	}
}

export const tier = (dbArgs) => {
	dbArgs.tableName = 'tier';
	return new Tier(dbArgs);
};
