import IBrandTable from '../interfaces/IBrandTable';
import Table from '../Table';
import { DateUtils } from '../../utils/utils';

export default class Brand extends Table implements IBrandTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	getAll(): Promise<Model.Brand[]> {
		return this.db.runQuery(`SELECT *
                                 FROM ${this.tableName};`);
	}

	getAllForCompany(companyId: number) {
		return this.db.runQuery(
			`SELECT *
             FROM ${this.tableName}
             WHERE companyId = ?;`,
			[companyId]
		);
	}

	async getReportsByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter?: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Brand.Res.Report[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQuery = Table.buildCompanyIdQuery(companyId, 'brand');
		let allObjects = await this.db.runQuery(
			`
			${Brand.reportSelect}
		 	FROM brand 
			LEFT JOIN (${Brand.brandSubquery}) report 
				on report.brandId = brand.id
		 	JOIN platformVariables on platformVariables.id = 1
                WHERE ${companyIdQuery} AND ${pageQuery.filterQuery} ${pageQuery.sortQuery}
			LIMIT ? OFFSET ?;
			SELECT COUNT(brand.id) as total FROM brand 
			LEFT JOIN (${Brand.brandSubquery}) report 
				on report.brandId = brand.id
			join platformVariables on platformVariables.id = 1
			WHERE ${companyIdQuery} AND ${pageQuery.filterQuery}`,
			[pagination.perPage, pageLimit]
		);

		let transactions = allObjects[0];
		const total = allObjects[1][0].total;
		return { data: transactions, total };
	}

	async exportReports(companyId: number): Promise<Api.Brand.Res.Report[]> {
		const companyIdQuery = Table.buildCompanyIdQuery(companyId, 'brand');
		let reports = await this.db.runQuery(
			`
			${Brand.reportSelect}
		 	FROM brand 
			LEFT JOIN (${Brand.brandSubquery}) report 
				on report.brandId = brand.id
		 	JOIN platformVariables on platformVariables.id = 1
		 	WHERE ${companyIdQuery};`
		);
		reports = reports.map((report) => {
			report.pointsPerDollar = report.ppd;
			report.costPerPoint = report.cpp;
			delete report.ppd;
			delete report.cpp;
			return report;
		});
		return reports;
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

	private static brandSubquery = `
			SELECT * FROM pointRates WHERE id in(SELECT MAX(id) FROM pointRates GROUP BY brandId)) AS brandRate
				ON brand.id = brandRate.brandId
		  	LEFT JOIN (SELECT * FROM pointRates WHERE id in(SELECT MAX(id) FROM pointRates GROUP BY companyId)) AS companyRate
				ON brand.companyId = companyRate.companyId
		  	LEFT JOIN (
			 	SELECT 
			 		YEAR(createdOn) as year,
				 	brandId,
				 	SUM(amount) as ytdTotal
			 	FROM transaction
			 	JOIN brandLocation bL
				 on transaction.brandLocationId = bL.id WHERE YEAR(createdOn) = YEAR(CURRENT_DATE)
				 GROUP BY brandId
			 `;

	private static reportSelect = `
		SELECT 
		brand.name as brandName,
		brand.id as brandId,
		TRUNCATE(COALESCE(brandRate.pointsPerDollar, companyRate.pointsPerDollar, 0), 4) as pointsPerDollar,
		TRUNCATE(COALESCE(brandRate.costPerPoint, companyRate.costPerPoint, 0), 4) as costPerPoint,
		TRUNCATE(COALESCE(brandRate.pointsPerDollar, companyRate.pointsPerDollar, 0)* COALESCE(brandRate.costPerPoint, companyRate.costPerPoint, 0), 4) as costToMerchant,
		TRUNCATE((COALESCE(brandRate.costPerPoint, companyRate.costPerPoint, 0) - platformVariables.redeemRatio)*COALESCE(brandRate.pointsPerDollar, companyRate.pointsPerDollar, 0), 4) spireRevenuePerDollar,
		TRUNCATE(IFNULL(((COALESCE(brandRate.costPerPoint, companyRate.costPerPoint, 0) - platformVariables.redeemRatio)/COALESCE(brandRate.costPerPoint, companyRate.costPerPoint, 0))*100, 0), 4) as spireRevenuePerPoint,
		TRUNCATE(IFNULL(report.ytdTotal * (SELECT spireRevenuePerDollar), 0), 4) as spireYTDRevenue,
		brand.loyaltyStatus as loyaltyStatus
	`;

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
