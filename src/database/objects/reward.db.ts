import { DateUtils, ObjectUtils } from '../../utils/utils';
import IRewardTable from '../interfaces/IRewardTable';
import Table from '../Table';
import mysql from 'mysql';
import { JsonDecoder } from 'ts.data.json';
import number = JsonDecoder.number;

export default class RewardTable extends Table implements IRewardTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	getById(rewardId: number, companyId?: number): Promise<Api.Reward.Res.Get> {
		return this.db.queryOne(
			`SELECT reward.id AS id,
			reward.name AS \`name\`,
			reward.pointCost AS pointCost,
			reward.monetaryValueInCents AS monetaryValueInCents,
			reward.destinationId As destinationId,
			reward.brandId AS brandId,
			reward.description AS \`description\`,
       		reward.redemptionInstructions AS \`redemptionInstructions\`,
			reward.upc AS upc,
			reward.isActive AS isActive,
			reward.createdOn AS createdOn,
			reward.modifiedOn AS modifiedOn,
			vendor.name AS vendorName,
			IFNULL(rewardVoucher.vouchers,'[]') vouchers,
			IFNULL(rewardMedia.media, '${Table.mediaNotFoundObject}') AS media,
			IFNULL(rewardCategories.categoryIds, '[]') AS categoryIds
		FROM reward
			LEFT JOIN(
				SELECT mediaMap.rewardId,
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
				GROUP BY mediaMap.rewardId
			) rewardMedia ON rewardMedia.rewardId = reward.id
			LEFT JOIN(
				SELECT rewardCategoryMap.rewardId,
					CONCAT('[', GROUP_CONCAT(id), ']') categoryIds
				FROM rewardCategory
					JOIN rewardCategoryMap ON rewardCategoryMap.categoryId = rewardCategory.id
				GROUP BY rewardCategoryMap.rewardId
			) rewardCategories ON rewardCategories.rewardId = reward.id
			LEFT JOIN vendor ON (
				vendor.destinationId = reward.destinationId
				OR vendor.brandId = reward.brandId
			)
			LEFT JOIN (
				SELECT rewardId, CONCAT('[', GROUP_CONCAT(CONCAT('{"id":',id, ',"customerUserId":', IFNULL(customerUserId,0),',"isActive":',isActive,',"isRedeemed":',isRedeemed,',"code":"',code,'"}')), ']') vouchers
				FROM rewardVoucher GROUP BY rewardId
			) rewardVoucher ON rewardVoucher.rewardId=reward.id
		WHERE reward.id = ?
			AND ${Table.buildCompanyIdQuery(companyId, this.tableName)}
		GROUP BY reward.id;`,
			[rewardId]
		);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<any> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		const allObjects = await this.db.runQuery(
			`SELECT reward.id AS id,
				reward.name AS \`name\`,
				reward.pointCost AS pointCost,
				reward.monetaryValueInCents AS monetaryValueInCents,
				reward.destinationId As destinationId,
				reward.brandId AS brandId,
				reward.description AS \`description\`,
				reward.upc AS upc,
				reward.isActive AS isActive,
				reward.createdOn AS createdOn,
				reward.modifiedOn AS modifiedOn,
				vendor.name AS vendorName,
				IFNULL(rewardVoucher.vouchers,'[]') vouchers,
				IFNULL(rewardMedia.media, '${Table.mediaNotFoundObject}') AS media,
				IFNULL(rewardCategories.categoryIds, '[]') AS categoryIds
			${RewardTable.rewardFromClause}
			WHERE
				${companyIdQueryString} AND
				${pageQuery.filterQuery}
				GROUP BY reward.id
				${pageQuery.sortQuery}
			LIMIT ?
			OFFSET ?;
			
			SELECT 
				Count(DISTINCT reward.id) AS total 
			${RewardTable.rewardFromClause}
			WHERE
				${companyIdQueryString} AND
				${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	async customerGetByPage(
		pagination: RedSky.PagePagination,
		vendorBrandIds: number[],
		vendorDestinationIds: number[],
		rewardCategoryIds: number[],
		minPointCost: number | null,
		maxPointCost: number | null,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Reward.Res.Get[]>> {
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		const filterQuery = RewardTable.formatRewardFilterQuery(
			vendorBrandIds,
			vendorDestinationIds,
			rewardCategoryIds,
			minPointCost,
			maxPointCost
		);
		const allObjects = await this.db.runQuery(
			`SELECT reward.id AS id,
				reward.name AS \`name\`,
				reward.pointCost AS pointCost,
				reward.monetaryValueInCents AS monetaryValueInCents,
				reward.destinationId As destinationId,
				reward.brandId AS brandId,
				reward.description AS \`description\`,
				reward.upc AS upc,
				reward.isActive AS isActive,
				reward.createdOn AS createdOn,
				reward.modifiedOn AS modifiedOn,
				vendor.name AS vendorName,
				IFNULL(rewardVoucher.vouchers,'[]') vouchers,
				IFNULL(rewardMedia.media, '${Table.mediaNotFoundObject}') AS media,
				IFNULL(rewardCategories.categoryIds, '[]') AS categoryIds
			${RewardTable.rewardFromClause}
			WHERE
				${companyIdQueryString} AND
				${filterQuery}
				GROUP BY reward.id
			LIMIT ?
			OFFSET ?;
			
			SELECT 
				Count(DISTINCT reward.id) AS total 
			${RewardTable.rewardFromClause}
			WHERE
				${companyIdQueryString} AND
				${filterQuery};`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	private static formatRewardFilterQuery(
		vendorBrandIds: number[],
		vendorDestinationIds: number[],
		rewardCategoryIds: number[],
		minPointCost: number | null,
		maxPointCost: number | null
	): string {
		let categoryFilter: string;
		let vendorBrandFilter: string;
		let vendorDestinationFilter: string;
		let pointCostFilter: string;
		if (ObjectUtils.isArrayWithData(vendorBrandIds)) {
			vendorBrandFilter = mysql.format(`vendor.brandId IN (?)`, [vendorBrandIds]);
		}
		if (ObjectUtils.isArrayWithData(vendorDestinationIds)) {
			vendorDestinationFilter = mysql.format(`vendor.destinationId IN (?)`, [vendorDestinationIds]);
		}
		if (ObjectUtils.isArrayWithData(rewardCategoryIds)) {
			categoryFilter = mysql.format(`map.categoryId IN (?)`, [rewardCategoryIds]);
		}
		if (minPointCost || maxPointCost) {
			const minCost = minPointCost ? mysql.format(`(pointCost>=?)`, [minPointCost]) : 'TRUE';
			const maxCost = maxPointCost ? mysql.format(`(pointCost<=?)`, [maxPointCost]) : 'TRUE';
			pointCostFilter = `(${minCost} AND ${maxCost})`;
		}
		return `${vendorBrandFilter || vendorDestinationFilter ? '(' : ''}${vendorBrandFilter || ''} ${
			vendorBrandFilter && vendorDestinationFilter ? 'OR' : ''
		} ${vendorDestinationFilter || ''}${
			vendorBrandFilter || vendorDestinationFilter ? ') AND' : ''
		} isActive=1 AND ${pointCostFilter || 'TRUE'} AND ${categoryFilter || 'TRUE'}`;
	}

	async update(id: number, reward: Partial<Model.Reward>, companyId?: number): Promise<any> {
		reward.modifiedOn = DateUtils.dbNow();
		const updates = Table.columnObjectStringify(reward);
		await this.db.runQuery(
			`UPDATE \`${this.tableName}\` SET ? WHERE id=? AND ${Table.buildCompanyIdQuery(companyId)};`,
			[updates, id]
		);
		return this.getById(id);
	}

	async deactivate(rewardId: number, companyId: number): Promise<number> {
		const result = await this.db.runQuery(
			`UPDATE ${this.tableName}
			SET isActive=FALSE,
				modifiedOn=CURRENT_TIMESTAMP
			WHERE id=? AND companyId=?;`,
			[rewardId, companyId]
		);
		if (result.affectedRows > 0) return rewardId;
	}

	async updateActiveStatus(rewardId: number, companyId?: number): Promise<number> {
		const result = await this.db.runQuery(
			`UPDATE ${this.tableName}
			SET isActive=!isActive,
				modifiedOn=CURRENT_TIMESTAMP
				WHERE id=? AND ${Table.buildCompanyIdQuery(companyId)};`,
			[rewardId]
		);
		if (result.affectedRows > 0) return rewardId;
	}

	async getRewardOnly(rewardId: number, companyId?: number): Promise<Model.Reward> {
		return await this.db.queryOne(
			`SELECT * FROM reward WHERE id=? AND ${Table.buildCompanyIdQuery(companyId, this.tableName)};`,
			[rewardId]
		);
	}

	delete: null;
	deleteMany: null;

	private static rewardFromClause: string = `
		FROM reward
			LEFT JOIN(
				SELECT mediaMap.rewardId,
					${Table.concatenateMediaArray}
				FROM media
					JOIN mediaMap ON mediaMap.mediaId = media.id
				GROUP BY mediaMap.rewardId
			) rewardMedia ON rewardMedia.rewardId = reward.id
			LEFT JOIN(
				SELECT rewardCategoryMap.rewardId,
					CONCAT('[', GROUP_CONCAT(id), ']') categoryIds
				FROM rewardCategory
					JOIN rewardCategoryMap ON rewardCategoryMap.categoryId = rewardCategory.id
				GROUP BY rewardCategoryMap.rewardId
			) rewardCategories ON rewardCategories.rewardId = reward.id
			LEFT JOIN vendor ON (
				vendor.destinationId = reward.destinationId
				OR vendor.brandId = reward.brandId
				)
			LEFT JOIN (
				SELECT rewardId, CONCAT('[', GROUP_CONCAT(CONCAT('{"id":',id,',"customerUserId":', IFNULL(customerUserId,0),',"isActive":',isActive,',"isRedeemed":',isRedeemed,',"code":"',code,'"}')), ']') vouchers
				FROM rewardVoucher GROUP BY rewardId
			) rewardVoucher ON rewardVoucher.rewardId=reward.id
			LEFT JOIN rewardCategoryMap AS \`map\` 
				ON map.rewardId=reward.id`;
}

export const reward = (dbArgs) => {
	dbArgs.tableName = 'reward';
	return new RewardTable(dbArgs);
};
