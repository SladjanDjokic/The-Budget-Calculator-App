import ICompanyTable, { CreateCompanyUserRole } from '../interfaces/ICompanyTable';
import TableMock from './table.db.mock';
import companyResource from '../../test/resources/company.service.resource';

export default class CompanyTableMock extends TableMock implements ICompanyTable {
	constructor(public readonly companies: Model.Company[]) {
		super();
	}

	async getById(id: number): Promise<Model.Company> {
		return this.companies.find((c) => {
			return c.id === id;
		});
	}

	columns: [
		'id',
		'name',
		'squareLogoUrl',
		'wideLogoUrl',
		'description',
		'createdOn',
		'modifiedOn',
		'vanityUrls',
		'privacyPolicyUrl',
		'termsConditionsUrl',
		'returnPolicyUrl',
		'address',
		'city',
		'state',
		'zip',
		'country'
	];
	create: (tableObj: any, companyId?: number) => Promise<any>;
	getManyByIds: (objIds: readonly number[], companyId?: number) => Promise<any>;
	update: (id: number, tableObj: any, companyId: number) => Promise<any>;
	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	delete: (id: number, companyId?: number) => Promise<number>;
	deleteMany: (ids: number[], companyId?: number) => Promise<any>;

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<any> {
		return {
			data: this.companies.slice((pagination.page - 1) * pagination.perPage, pagination.perPage),
			total: this.companies.length
		};
	}

	getByVanityUrl(hostname: string) {
		return null;
	}
	getGateways() {
		return null;
	}
	getClientGatewayPublic() {
		return null;
	}

	getByHostname(hostname: string) {
		return null;
	}

	isDomainUnique(domain: string) {
		return null;
	}

	getByDomain(domain: string) {
		return null;
	}

	getByName(name: string) {
		return null;
	}

	async getCompanyIds() {
		return this.companies.map((c) => {
			return { id: c.id };
		});
	}

	async getCompanyAndClientVariables(id: number): Promise<Api.Company.Res.GetCompanyAndClientVariables> {
		return companyResource.companyAndClientVariables;
	}

	async createCompanyUserRole(createData: CreateCompanyUserRole): Promise<Model.UserRole> {
		return companyResource.adminUserRole;
	}

	async getEarnPointRatio(): Promise<number> {
		return 10;
	}

	async getRedemptionRatio(): Promise<number> {
		return 0.7;
	}
}
