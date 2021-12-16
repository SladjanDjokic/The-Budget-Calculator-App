import { Service } from '../Service';
import { RsError } from '../../utils/errors';
import { ObjectUtils, WebUtils } from '../../utils/utils';
import ICompanyService from './ICompanyService';
import ICompanyTable, { CreateCompanyUserRole } from '../../database/interfaces/ICompanyTable';
import ICompanyVariablesTable from '../../database/interfaces/ICompanyVariablesTable';
import UserService from '../user/user.service';
import { ServiceName } from '../serviceFactory';
import config from '../../utils/config';
import { IRedisClient } from '../../integrations/redis/IRedisClient';

export default class CompanyService extends Service implements ICompanyService {
	userService: UserService;
	private static readonly platformCompanyId: number = 0;

	constructor(
		readonly companyTable: ICompanyTable,
		readonly companyVariablesTable: ICompanyVariablesTable,
		readonly redisClient: IRedisClient
	) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.userService = services['UserService'] as UserService;
	}

	static getAdminUrl() {
		function hostName() {
			return config.isProduction ? 'https://admin.spireloyalty.com' : 'https://sand-admin.spireloyalty.com/';
		}

		return config?.isLocalHost ? 'localhost:3000' : hostName();
	}

	/**
	 * Returns a company by the given url if it can be found
	 * @throws Not Found
	 * @param url Example : truvy.ontrac.io or app.solvasa.com
	 * @returns The company if one was found
	 */
	getCompanyByUrl(url: string): Promise<Model.Company> {
		try {
			return this.companyTable.getByVanityUrl(WebUtils.getHostname(url));
		} catch {
			return null;
		}
	}

	/**
	 * Returns a company by the given id which should match the companies id
	 * @thorws Not Found
	 * @param id The company id
	 * @returns The company if one was found
	 */
	async getCompanyById(id: number): Promise<Model.Company> {
		return await this.companyTable.getById(id);
	}

	private isValidCompanyOrThrow(obj: any) {
		let isValid = true;
		for (let i in obj) {
			if (i === 'country' && obj[i].length > 2) {
				isValid = false;
				break;
			}
			if (obj[i] === undefined || obj[i] === null || obj[i] === '') {
				isValid = false;
				break;
			}
		}
		if (!isValid) throw new RsError('BAD_REQUEST', `Invalid data in create company`);
	}

	async create(createData: Api.Company.Req.Create): Promise<Api.Company.Res.Get> {
		const { newAdminPassword, newAdminEmail, ...companyCreate } = createData;
		this.isValidCompanyOrThrow(companyCreate);

		let company: Model.Company = await this.companyTable.create(companyCreate);

		await this.companyVariablesTable.create({ companyId: company.id });

		let companyAdminUserRole = await this.createDefaultAdminUserRole();

		let userCreateObj: Api.User.Req.Create = {
			firstName: 'Admin',
			lastName: 'User',
			password: createData.newAdminPassword,
			primaryEmail: createData.newAdminEmail,
			userRoleId: companyAdminUserRole.id
		};
		await this.userService.createAdmin(userCreateObj);

		// Todo: create companyServiceKeys

		return company;
	}

	async update(id: number, obj): Promise<Api.Company.Res.Details> {
		if (obj.hasOwnProperty('isBuyer')) throw new RsError('BAD_REQUEST', 'Invalid field isBuyer');
		if (obj.domainName) throw new RsError('FORBIDDEN', 'Action is not allowed');
		return await this.companyTable.update(id, obj, obj.companyId);
	}

	async isDomainUnique(domain: string) {
		try {
			let rootDomain = WebUtils.getDomain(domain);
			let result: boolean = await this.companyTable.isDomainUnique(rootDomain);
			if (!result) throw new RsError('DUPLICATE', `Duplicate domain ${rootDomain} found.`);
			return result;
		} catch (e) {
			throw new RsError('BAD_REQUEST', 'Invalid domain');
		}
	}

	async getByDomain(domain: string) {
		return await this.companyTable.getByDomain(domain);
	}

	async getByName(name: string) {
		return await this.companyTable.getByName(name);
	}

	async getById(id: number): Promise<any> {
		return this.companyTable.getById(id);
	}

	getByPage(pageQuery: RedSky.PageQuery): Promise<RedSky.RsPagedResponseData<Api.Company.Res.Details[]>> {
		return this.companyTable.getByPage(pageQuery.pagination, pageQuery.sort, pageQuery.filter);
	}

	getDetailsById(companyId: number): Promise<Api.Company.Res.Details> {
		return this.companyTable.getDetails(companyId);
	}

	getCompanyAndClientVariables(id: number): Promise<Api.Company.Res.GetCompanyAndClientVariables> {
		return this.companyTable.getCompanyAndClientVariables(id || CompanyService.platformCompanyId);
	}

	async delete(id: number) {
		return await this.companyTable.delete(id);
	}

	getCompanyIds() {
		return this.companyTable.getCompanyIds();
	}

	getVariables(companyId: number): Promise<Model.CompanyVariables> {
		return this.companyVariablesTable.getByCompanyId(companyId);
	}

	updateCompanyVariables(
		companyId: number,
		variablesToUpdate: Omit<Partial<Model.CompanyVariables>, 'companyId'>
	): Promise<boolean> {
		return this.companyVariablesTable.update(companyId, variablesToUpdate);
	}

	async updateAvailablePages(availablePages: Model.PageGuard[]): Promise<boolean> {
		try {
			await this.redisClient.set(`availablePages`, JSON.stringify(availablePages));
			return true;
		} catch (e) {
			return false;
		}
	}

	async getAvailablePages(companyId: number): Promise<Model.PageGuard[]> {
		const availablePages = await this.redisClient.get('availablePages');
		if (!availablePages) throw new RsError('NOT_FOUND', 'Unable to find available pages');
		return ObjectUtils.smartParse(availablePages);
	}

	/**
	 * Ratio is currently 10:1 we need to get more detail to figure out where the ratio will actually live
	 */
	getEarnPointRatio(): Promise<number> {
		return this.companyTable.getEarnPointRatio();
	}

	getRedemptionPointRatio(): Promise<number> {
		return this.companyTable.getRedemptionRatio();
	}

	private async createDefaultAdminUserRole(): Promise<Model.UserRole> {
		// This should contain everything but COMPANY which is reserved for spire_super_admin
		let adminRoles: Model.UserRoleAccessScope[] = [
			{ accessScope: 'USER', read: 1, write: 1 },
			{ accessScope: 'USER_POINTS', read: 1, write: 1 },
			{ accessScope: 'POINTS', read: 1, write: 1 },
			{ accessScope: 'LOYALTY_CAMPAIGNS', read: 1, write: 1 },
			{ accessScope: 'LOYALTY_REWARDS', read: 1, write: 1 },
			{ accessScope: 'ADMINISTRATION', read: 1, write: 1 },
			{ accessScope: 'ANALYTICS', read: 1, write: 1 },
			{ accessScope: 'ORDERS', read: 1, write: 1 },
			{ accessScope: 'REAL_ESTATE', read: 1, write: 1 },
			{ accessScope: 'MEDIA_ACCESS', read: 1, write: 1 },
			{ accessScope: 'REPORTING', read: 1, write: 0 }
		];
		let createUserRole: CreateCompanyUserRole = {
			accessScope: adminRoles,
			isAdmin: 1,
			isCustomer: 0,
			name: 'admin'
		};
		return this.companyTable.createCompanyUserRole(createUserRole);
	}
}
