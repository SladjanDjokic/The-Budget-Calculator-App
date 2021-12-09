import Table from '../Table';

export default class BrandLocation extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getForBrand(brandId: number, companyId: number) {
		return await this.db.runQuery(
			`SELECT * 
				FROM ${this.tableName} AS location
					JOIN brand ON brand.id = location.brandId
				WHERE location.brandId = ?
					AND brand.companyId = ?;`,
			[brandId, companyId]
		);
	}

	async getDetails(brandId: number, companyId?: number): Promise<Api.Brand.Res.Location.Details> {
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		return this.db.queryOne(
			`SELECT *
                                 FROM brandLocation
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
	): Promise<RedSky.RsPagedResponseData<Api.Brand.Res.Location.Details[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		let brands = await this.db.runQuery(
			`SELECT *
             FROM brandLocation
             WHERE ${companyIdQueryString}
               AND ${pageQuery.filterQuery} ${pageQuery.sortQuery} 
			LIMIT ?
             OFFSET ?;
            SELECT Count(id) as total
            FROM brandLocation
            WHERE ${companyIdQueryString}
              AND ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);

		return { data: brands[0], total: brands[1][0].total };
	}

	delete: null;
	deleteMany: null;
}

export const brandLocation = (dbArgs) => {
	dbArgs.tableName = 'brandLocation';
	return new BrandLocation(dbArgs);
};
