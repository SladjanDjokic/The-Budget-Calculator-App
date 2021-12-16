import { Service } from '../Service';
import IUserBusinessTable from '../../database/interfaces/IUserBusinessTable';
import { ServiceName } from '../serviceFactory';
import ICompanyService from '../company/ICompanyService';
import CompanyService from '../company/company.service';

export default class UserBusinessService extends Service {
	companyService: ICompanyService;

	constructor(private readonly userBusinessTable: IUserBusinessTable) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.companyService = services['CompanyService'] as CompanyService;
	}

	async create(data: Api.UserBusiness.Req.Create): Promise<Model.UserBusiness> {
		return this.userBusinessTable.create(data);
	}

	async getByUserId(userId: number): Promise<Model.UserBusiness[]> {
		return this.userBusinessTable.getByUserId(userId);
	}
}
