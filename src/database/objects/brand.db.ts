import IBrandTable from '../interfaces/IBrandTable';
import Table from '../Table';
import { DateUtils } from '../../utils/utils';

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
			`SELECT brand.*,
       				IFNULL(bl.locations, '[]') locations,
                    company.name as companyName
                     FROM brand
					  LEFT JOIN (
					      SELECT brandId, 
					             ${Brand.brandLocationQuery} as locations 
					      		FROM brandLocation
					      			GROUP BY brandId) bl
								ON bl.brandId = brand.id
                    LEFT JOIN company on brand.companyId = company.id
                     WHERE brand.id = ?
                       AND ${companyIdQueryString};`,
			[brandId]
		);
	}

	async getLocations(brandId: number): Promise<Api.Brand.Res.Location.Details[]> {
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
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Brand.Res.Details[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		let brands = await this.db.runQuery(
			`SELECT brand.*,
       				IFNULL(bl.locations, '[]') locations,
                    company.name as companyName
             FROM brand
                 LEFT JOIN (
                     SELECT brandId,
                            ${Brand.brandLocationQuery} 
                                as locations FROM brandLocation
                     GROUP BY brandId) bl
                 	ON bl.brandId = brand.id
            LEFT JOIN company on brand.companyId = company.id
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

	async update(id: number, tableObj: any, companyId?: number): Promise<Api.Brand.Res.Details> {
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		if (this.columns) {
			if (this.columns.includes('modifiedOn')) tableObj.modifiedOn = DateUtils.dbNow();
		}

		tableObj = Table.columnObjectStringify(tableObj);
		await this.db.runQuery(
			`UPDATE ${this.tableName}
                                SET ?
                                WHERE id = ?
                                  AND ${companyIdQueryString}`,
			[tableObj, id]
		);

		return await this.getDetails(id, companyId);
	}

	delete: null;
	deleteMany: null;

	private static brandLocationQuery = `
		 CONCAT('[',
               GROUP_CONCAT('{
                    "id":', id,
                    ',"name":"', IFNULL(name, ''),
                    '","loyaltyStatus":"', loyaltyStatus,
                    '","city":"', city,
                    '","state":"', state,
                '"}'
            ), ']')
	`;
}

export const brand = (dbArgs) => {
	dbArgs.tableName = 'brand';
	return new Brand(dbArgs);
};
