import Table from '../Table';
import ICompanyTable, { CreateCompanyUserRole } from '../interfaces/ICompanyTable';
import { DateUtils } from '../../utils/utils';
import { RsError } from '../../utils/errors';

export default class Company extends Table implements ICompanyTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async isDomainUnique(rootDomain: string) {
		try {
			let rows = await this.db.queryOne('SELECT * FROM company WHERE domainName=?;', [rootDomain]);
			return false;
		} catch (e) {
			return true;
		}
	}

	async getByDomain(domain: string) {
		let rows = await this.db.queryOne('SELECT * FROM company WHERE domainName=?;', [domain]);
		return rows;
	}

	async getByName(name: string) {
		let rows = await this.db.queryOne('SELECT * FROM company WHERE name=?;', [name]);
		return rows;
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	): Promise<RedSky.RsPagedResponseData<Api.Company.Res.Details[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		let companies = await this.db.runQuery(
			`SELECT *
             FROM company
             WHERE ${pageQuery.filterQuery} ${pageQuery.sortQuery} 
			LIMIT ?
             OFFSET ?;
            SELECT Count(id) as total
            FROM company
            WHERE ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);

		return { data: companies[0], total: companies[1][0].total };
	}

	async getDetails(companyId): Promise<Api.Company.Res.Details> {
		return this.db.queryOne('SELECT * FROM company WHERE id=?;', [companyId]);
	}

	getCompanyAndClientVariables(id: number): Promise<Api.Company.Res.GetCompanyAndClientVariables> {
		return this.db.queryOne(
			`SELECT 
       			company.id, 
       			company.name, 
       			company.squareLogoUrl, 
       			company.wideLogoUrl, 
				companyVariables.allowPointBooking, 
       			companyVariables.allowCashBooking, 
       			companyVariables.customPages,
       			companyVariables.unauthorizedPages
			FROM company JOIN companyVariables ON company.id = companyVariables.companyId 
			WHERE company.id = ?`,
			[id]
		);
	}

	async getByHostname(hostname: string): Promise<Model.Company> {
		return await this.db.queryOne('SELECT * FROM company WHERE hostname=?;', [hostname]);
	}

	async getByVanityUrl(hostname: string): Promise<Model.Company> {
		return await this.db.queryOne('select * from company where JSON_SEARCH(vanityUrls,"one",?) IS NOT NULL;', [
			hostname
		]);
	}

	getCompanyIds(): Promise<{ id: number }[]> {
		return this.db.runQuery('SELECT id FROM company;', []);
	}

	async getEarnPointRatio(): Promise<number> {
		return (await this.db.queryOne('SELECT earnRatio FROM platformVariables')).earnRatio;
	}

	async getRedemptionRatio(): Promise<number> {
		return (await this.db.queryOne('SELECT redeemRatio FROM platformVariables')).redeemRatio;
	}

	getGateways(): Promise<Model.CompanyGateway[]> {
		return this.db.runQuery('SELECT * FROM paymentGateway;', []);
	}

	getClientGatewayPublic(): Promise<Api.Payment.Res.PublicData> {
		return this.db.queryOne(
			'SELECT id, name, publicData FROM paymentGateway WHERE isActive=1 AND isPrimary=1;',
			[]
		);
	}

	async createCompanyUserRole(createData: CreateCompanyUserRole): Promise<Model.UserRole> {
		let createRole: Omit<Model.UserRole, 'id'> = {
			createdOn: DateUtils.dbNow(),
			modifiedOn: DateUtils.dbNow(),
			...createData
		};

		createRole = Table.columnObjectStringify(createRole);
		try {
			const result = await this.db.runQuery(`INSERT INTO userRole SET ?;`, [createRole]);
			return this.db.queryOne('SELECT * FROM userRole WHERE id=?;', [result.insertId]);
		} catch (e) {
			if (e.err && e.err.code === 'ER_DUP_ENTRY') throw new RsError('DUPLICATE', e.err.sqlMessage);
			throw new RsError('UNKNOWN_ERROR', e.err.sqlMessage);
		}
	}
}

export const company = (dbArgs) => {
	dbArgs.tableName = 'company';
	return new Company(dbArgs);
};
