import ICompanyService from './ICompanyService';
import { ServiceName } from '../serviceFactory';
import { Service } from '../Service';

export default class CompanyServiceMock implements ICompanyService {
	getVariablesCalls: number = 0;
	constructor(private readonly variables: Model.CompanyVariables) {}
	start(services: Partial<Record<ServiceName, Service>>) {}

	getEarnPointRatio(): Promise<number> {
		return Promise.resolve(10);
	}

	getRedemptionPointRatio(): Promise<number> {
		return Promise.resolve(0.7);
	}

	async getVariables(companyId: number): Promise<Model.CompanyVariables> {
		this.getVariablesCalls++;
		return this.variables;
	}
}
