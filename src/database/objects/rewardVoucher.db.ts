import { ObjectUtils } from '../../utils/utils';
import { RsError } from '../../utils/errors';
import IRewardVoucherTable from '../interfaces/IRewardVoucherTable';
import Table from '../Table';

export interface Claim extends Api.Reward.Voucher.Req.Claim {
	user: Model.User;
	redemptionInstructions?: string;
	pointCost?: number;
}

export default class RewardVoucherTable extends Table implements IRewardVoucherTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async createMany(vouchersToCreate: Partial<Model.RewardVoucher>[]): Promise<Model.RewardVoucher[]> {
		const columns = [`rewardId`, `code`];
		const [columnNames, valuesToInsert] = this.formatForBulkInsert(vouchersToCreate, columns);
		const codes: string[] = vouchersToCreate.map((v) => v.code);
		const rewardId = vouchersToCreate[0].rewardId;
		try {
			const result = await this.db.runQuery(
				`INSERT INTO \`${this.tableName}\` (${columnNames})
				VALUES ? ;
				SELECT
					\`rewardId\`,
					\`code\`,
					\`isActive\`,
					\`isRedeemed\`,
					\`createdOn\`,
					\`modifiedOn\`
				FROM \`${this.tableName}\`
				WHERE \`rewardId\`=? AND \`code\` IN (?);`,
				[valuesToInsert, rewardId, codes]
			);
			return result[1];
		} catch (e) {
			if (e.err && e.err.code === 'ER_DUP_ENTRY') {
				throw new RsError('DUPLICATE', e.err.sqlMessage);
			}
			throw new RsError('UNKNOWN_ERROR', e);
		}
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	): Promise<RedSky.RsPagedResponseData<Model.RewardVoucher>> {
		if (sort.field === 'id') sort.field = 'rewardId';
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		let allObjects = await this.db.runQuery(
			`SELECT *
			 FROM ${this.tableName}
			 WHERE
			 ${pageQuery.filterQuery}
			 ${pageQuery.sortQuery} 
			 LIMIT ?
			 OFFSET ?; SELECT Count(code) as total FROM ${this.tableName} WHERE ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	async get(rewardId: number, code: string) {
		return await this.db.queryOne('SELECT * FROM rewardVoucher WHERE rewardId=? AND code REGEXP ?;', [
			rewardId,
			code
		]);
	}

	async deactivate(rewardId: number, code: string, companyId: number): Promise<Api.Reward.Voucher.Res.Delete> {
		const result = await this.db.runQuery(
			`UPDATE ${this.tableName}
				 JOIN reward
			 ON reward.id = ${this.tableName}.rewardId
				 SET ${this.tableName}.isActive=FALSE, ${this.tableName}.modifiedOn=CURRENT_TIMESTAMP
			 WHERE reward.companyId=? AND ${this.tableName}.rewardId=? AND ${this.tableName}.code REGEXP ?;`,
			[companyId, rewardId, code]
		);
		if (result.affectedRows > 0) return { rewardId, code };
		throw new RsError('NOT_FOUND', 'No such reward voucher found');
	}

	async claim(claimDetails: Claim): Promise<Api.Reward.Voucher.Res.Claim> {
		const result = await this.db.runQuery(
			'UPDATE rewardVoucher SET customerUserId=?, modifiedOn=NOW() WHERE rewardId=? AND code REGEXP ?;',
			[claimDetails.user.id, claimDetails.rewardId, claimDetails.code]
		);
		if (result.affectedRows == 0) throw new RsError('BAD_REQUEST', 'Failed to claim voucher');
		return this.get(claimDetails.rewardId, claimDetails.code);
	}

	private formatForBulkInsert<T>(
		values: Partial<T>[],
		columns: string[]
	): [columnNames: string, values: Array<Array<T>>] {
		const output = [];
		for (let instance of values) {
			const properties = [];
			for (let col of columns) {
				if (instance.hasOwnProperty(col)) {
					properties.push(instance[col]);
				} else {
					properties.push(null);
				}
			}
			if (properties.length === 0) continue;
			output.push(properties);
		}
		return [columns.join(','), output];
	}
}

export const rewardVoucher = (dbArgs) => {
	dbArgs.tableName = 'rewardVoucher';
	return new RewardVoucherTable(dbArgs);
};
