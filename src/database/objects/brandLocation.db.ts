import Table from '../Table';
import { DateUtils } from '../../utils/utils';

export default class BrandLocation extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getDetails(id: number): Promise<Api.Brand.Res.Location.Details> {
		return this.db.queryOne(
			`SELECT *
					 FROM brandLocation
					 WHERE id = ?;`,
			[id]
		);
	}

	async getLocationsForBrand(brandId: number): Promise<Api.Brand.Res.Location.Details[]> {
		return await this.db.runQuery(
			`SELECT * 
				FROM brandLocation
				WHERE brandLocation.brandId = ?;`,
			[brandId]
		);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	): Promise<RedSky.RsPagedResponseData<Api.Brand.Res.Location.Details[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		let brands = await this.db.runQuery(
			`SELECT *
             FROM brandLocation
             WHERE ${pageQuery.filterQuery} ${pageQuery.sortQuery} 
			LIMIT ?
             OFFSET ?;
            SELECT Count(id) as total
            FROM brandLocation
            WHERE ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);

		return { data: brands[0], total: brands[1][0].total };
	}

	async update(id: number, tableObj: any, companyId?: number): Promise<any> {
		if (this.columns) {
			if (this.columns.includes('modifiedOn')) tableObj.modifiedOn = DateUtils.dbNow();
		}

		tableObj = Table.columnObjectStringify(tableObj);
		await this.db.runQuery(`UPDATE brandLocation SET ? WHERE id=?;`, [tableObj, id]);

		return await this.getDetails(id);
	}

	delete: null;
	deleteMany: null;
}

export const brandLocation = (dbArgs) => {
	dbArgs.tableName = 'brandLocation';
	return new BrandLocation(dbArgs);
};
