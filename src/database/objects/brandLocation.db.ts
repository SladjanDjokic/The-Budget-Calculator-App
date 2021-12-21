import Table from '../Table';
import { DateUtils } from '../../utils/utils';
import mysql from 'mysql';

export default class BrandLocation extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getLocationsForBrand(brandId: number): Promise<Api.Brand.Res.Location.Details[]> {
		return await this.db.runQuery(
			`SELECT * 
				FROM brandLocation
				WHERE brandLocation.brandId = ?;`,
			[brandId]
		);
	}

	async getDetails(id: number): Promise<Api.Brand.Res.Location.Details> {
		const result = await this.db.queryOne(
			`
				SELECT brandLocation.*,
				       pointRate.pointsPerDollar,
				       pointRate.costPerPoint,
					   TRUNCATE(((transactions.ytdTotal * pointRate.costPerPoint - platformVariables.redeemRatio) * pointRate.pointsPerDollar), 4) as spireYTDRevenue
				FROM brandLocation
						 JOIN brand
							  on brandLocation.brandId = brand.id
						 LEFT JOIN (
					SELECT * FROM pointRates
					WHERE id in (SELECT MAX(id) FROM pointRates GROUP BY brandLocationId)) as brandLocationRate
								   on brandLocation.id = brandLocationRate.brandLocationId
				 LEFT JOIN (${BrandLocation.pointRateSubquery}) pointRate
					on pointRate.brandLocationId = brandLocation.id
				 LEFT JOIN (SELECT brandLocationId, sum(amount) as ytdTotal FROM transaction WHERE YEAR(createdOn) = YEAR(CURDATE())) transactions on transactions.brandLocationId = brandLocation.id
					JOIN platformVariables on platformVariables.id = 1
             WHERE brandLocation.id = ?;`,
			[id]
		);
		return result;
	}

	async getLocationsByPage(
		brandId: number,
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter?: RedSky.FilterQuery
	): Promise<RedSky.RsPagedResponseData<Api.Brand.Res.Location.Details[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		let brands = await this.db.runQuery(
			`
				SELECT 
				   brandLocation.*,
				   pointRate.costPerPoint,
				   pointRate.pointsPerDollar,
					TRUNCATE(((transactions.ytdTotal * pointRate.costPerPoint - platformVariables.redeemRatio) * pointRate.pointsPerDollar), 4) as spireYTDRevenue
				FROM brandLocation
				 JOIN brand
					  on brandLocation.brandId = brand.id
				 LEFT JOIN (${BrandLocation.pointRateSubquery}) pointRate 
				     on pointRate.brandLocationId = brandLocation.id
					 LEFT JOIN (SELECT brandLocationId, SUM(amount) as ytdTotal FROM transaction WHERE YEAR(createdOn) = YEAR(CURDATE()) GROUP BY brandLocationId) transactions on transactions.brandLocationId = brandLocation.id
					JOIN platformVariables on platformVariables.id = 1
             WHERE brand.id = ? AND ${pageQuery.filterQuery} ${pageQuery.sortQuery} 
			LIMIT ?
             OFFSET ?;
            SELECT COUNT(id) as total
            FROM brandLocation
            WHERE brandId = ? AND ${pageQuery.filterQuery};`,
			[brandId, pagination.perPage, pageLimit, brandId]
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

	async getTransactionsByPage(
		brandLocationId: number,
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter?: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Brand.Res.Location.Transaction[]>> {
		let pageQuery = this.buildPageQuery(sort, 'transaction', filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQuery = Table.buildCompanyIdQuery(companyId, 'pointRate');
		const pageResults = await this.db.runQuery(
			`
           ${BrandLocation.transactionSelect}
           ${BrandLocation.transactionFromStatement}
            WHERE transaction.brandLocationId = ? AND ${companyIdQuery}
              AND ${pageQuery.filterQuery} ${pageQuery.sortQuery}
			LIMIT ?
			OFFSET ?;
            SELECT COUNT(transaction.externalId) as total
            ${BrandLocation.transactionFromStatement}
            WHERE transaction.brandLocationId = ? AND ${companyIdQuery} AND ${pageQuery.filterQuery};`,
			[brandLocationId, pagination.perPage, pageLimit, brandLocationId]
		);
		const transactions: Api.Brand.Res.Location.Transaction[] = pageResults[0];
		const total = pageResults[1][0].total;
		return { data: transactions, total };
	}

	async getLocationsOverviewByPage(
		brandLocationId: number,
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter?: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Brand.Res.Report[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQuery = Table.buildCompanyIdQuery(companyId, 'pointRate');
		const pagedResults = await this.db.runQuery(
			`
		SELECT
		   brandLocation.id,
		   brandLocation.name as locationName,
		   pointRate.pointsPerDollar as pointsPerDollar,
		   pointRate.costPerPoint as costPerPoint,
		   TRUNCATE(pointRate.pointsPerDollar * pointRate.costPerPoint, 4) as costToMerchant,
		   TRUNCATE((pointRate.costPerPoint - platformVariables.redeemRatio)*pointRate.pointsPerDollar, 4) spireRevenuePerDollar,
		   TRUNCATE(IFNULL(((pointRate.costPerPoint - platformVariables.redeemRatio)/pointRate.costPerPoint)*100, 0), 2) as spireRevenuePerPoint,
		   TRUNCATE(IFNULL(amount * (SELECT spireRevenuePerDollar), 0), 4) as spireYTDRevenue,
		   brandLocation.loyaltyStatus
		FROM brandLocation
			LEFT JOIN (
				SELECT
					   brandLocationId,
					   SUM(amount) as amount
					FROM transaction
					WHERE YEAR(createdOn) = YEAR(CURDATE())
				GROUP BY brandLocationId
				) t on brandLocation.id = t.brandLocationId
			JOIN brand
				 on brandLocation.brandId = brand.id
			LEFT JOIN(${BrandLocation.pointRateSubquery}) pointRate 
			    ON pointRate.brandLocationId = brandLocation.id
			JOIN platformVariables on platformVariables.id = 1
			WHERE brandLocation.brandId = ? AND ${companyIdQuery}
			  AND ${pageQuery.filterQuery} 
			GROUP BY brandLocation.id
			${pageQuery.sortQuery}
			LIMIT ?
			OFFSET ?;
		SELECT COUNT(brandLocation.id) as total
			FROM brandLocation WHERE brandLocation.brandId = ?;
        `,
			[brandLocationId, pagination.perPage, pageLimit, brandLocationId]
		);
		const transactions = pagedResults[0];
		const total = pagedResults[1][0].total;
		return { data: transactions, total };
	}

	exportLocationsOverviewReport(brandId: number, companyId?: number): Promise<Api.Brand.Res.Report[]> {
		const companyIdQuery = Table.buildCompanyIdQuery(companyId, 'pointRate');
		return this.db.runQuery(
			`
		SELECT
		   brandLocation.id,
		   brandLocation.name as locationName,
           pointRate.pointsPerDollar as pointsPerDollar,
           pointRate.costPerPoint as costPerPoint,
		   TRUNCATE((SELECT pointsPerDollar) * (SELECT costPerPoint), 4) as costToMerchant,
		   TRUNCATE(((SELECT costPerPoint) - platformVariables.redeemRatio)*(SELECT pointsPerDollar), 4) spireRevenuePerDollar,
		   TRUNCATE(IFNULL((((SELECT costPerPoint) - platformVariables.redeemRatio)/(SELECT costPerPoint))*100, 0), 2) as spireRevenuePerPoint,
		   TRUNCATE(IFNULL(amount * (SELECT spireRevenuePerDollar), 0), 4) as spireYTDRevenue,
		   brandLocation.loyaltyStatus
		FROM brandLocation
			LEFT JOIN (
				SELECT
					   brandLocationId,
					   SUM(amount) as amount
					FROM transaction
					WHERE YEAR(createdOn) = YEAR(CURDATE())
				GROUP BY brandLocationId
				) t on brandLocation.id = t.brandLocationId
			JOIN brand
				 on brandLocation.brandId = brand.id
			LEFT JOIN(${BrandLocation.pointRateSubquery}) pointRate 
			    ON pointRate.brandLocationId = brandLocation.id
			JOIN platformVariables on platformVariables.id = 1
			WHERE brandLocation.brandId = ? AND ${companyIdQuery}`,
			[brandId]
		);
	}

	exportReports(brandLocationId: number, companyId?: number) {
		const companyIdQuery = Table.buildCompanyIdQuery(companyId, 'pointRate');
		return this.db.runQuery(
			`
			${BrandLocation.transactionSelect}
			${BrandLocation.transactionFromStatement}
			WHERE transaction.brandLocationId = ? AND ${companyIdQuery};`,
			[brandLocationId]
		);
	}

	private static pointRateSubquery = `
        SELECT brandLocation.id as brandLocationId,
               brand.companyId as companyId,
               TRUNCATE(COALESCE(brandLocationRate.pointsPerDollar, brandRate.pointsPerDollar, companyRate.pointsPerDollar,
                        0), 4) as pointsPerDollar,
               TRUNCATE(COALESCE(brandLocationRate.costPerPoint, brandRate.costPerPoint, companyRate.costPerPoint,
                        0), 4) as costPerPoint
        FROM brandLocation
                 JOIN brand
                      on brandLocation.brandId = brand.id
                 LEFT JOIN (SELECT *
                            FROM pointRates
                            WHERE id in (SELECT MAX(id) FROM pointRates GROUP BY brandLocationId)) as brandLocationRate
                           on brandLocation.id = brandLocationRate.brandLocationId
                 LEFT JOIN (SELECT *
                            FROM pointRates
                            WHERE id in (SELECT MAX(id) FROM pointRates GROUP BY brandId)) as brandRate
                           on brandRate.brandId = brandLocation.brandId
                 LEFT JOIN (SELECT *
                            FROM pointRates
                            WHERE id in (SELECT MAX(id) FROM pointRates GROUP BY companyId)) as companyRate
                           on companyRate.companyId = brand.companyId
    `;

	private static transactionSelect = `
		SELECT 
	   transaction.createdOn as transactionDate,
	   transaction.externalId as transactionId,
	   #source,
	   user.cardType as cardType,
	   last4,
	   pointRate.pointsPerDollar * transaction.amount as pointsTransacted,
	   transaction.amount as totalTransactionAmount,
	   (SELECT pointsTransacted) * pointRate.costPerPoint as deferredRevenue,
	   user.customerName,
	   primaryEmail
		`;

	private static transactionFromStatement = `
	FROM transaction
		 	JOIN (
                SELECT 
				   CONCAT(user.firstName, ' ', user.lastName) as customerName,
				   user.primaryEmail,
				   uPM.id paymentMethodId,
				   uPM.type as cardType,
				   uPM.last4
                FROM user
				   LEFT JOIN userPaymentMethod uPM on user.id = uPM.userId
			 ) user
            	on user.paymentMethodId = transaction.paymentMethodId
			LEFT JOIN (
				${BrandLocation.pointRateSubquery}
			) pointRate ON pointRate.brandLocationId = transaction.brandLocationId
	`;

	delete: null;
	deleteMany: null;
}

export const brandLocation = (dbArgs) => {
	dbArgs.tableName = 'brandLocation';
	return new BrandLocation(dbArgs);
};
