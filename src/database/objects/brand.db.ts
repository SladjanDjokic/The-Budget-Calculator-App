import IBrandTable from '../interfaces/IBrandTable';
import Table from '../Table';
import { ObjectUtils } from '../../utils/utils';

export default class Brand extends Table implements IBrandTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	getAll(): Promise<Model.Brand[]> {
		return this.db.runQuery(`SELECT * FROM ${this.tableName};`);
	}

	getAllForCompany(companyId: number) {
		return this.db.runQuery(`SELECT * FROM ${this.tableName} WHERE companyId=?;`, [companyId]);
	}

	async getDetails(brandId: number, companyId?: number): Promise<Api.Brand.Res.Details> {
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		return this.db.queryOne(
			`SELECT *
                                 FROM brand
                                 WHERE id = ?
                                   AND ${companyIdQueryString};`,
			[brandId]
		);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Brand.Res.Details[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		let brands = await this.db.runQuery(
			`SELECT *
             FROM brand
             WHERE ${companyIdQueryString}
               AND ${pageQuery.filterQuery} ${pageQuery.sortQuery} 
			LIMIT ?
             OFFSET ?;
            SELECT Count(id) as total
            FROM brand
            WHERE ${companyIdQueryString}
              AND ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);

		return { data: brands[0], total: brands[1][0].total };
	}

	delete: null;
	deleteMany: null;
}

export const brand = (dbArgs) => {
	dbArgs.tableName = 'brand';
	return new Brand(dbArgs);
};
