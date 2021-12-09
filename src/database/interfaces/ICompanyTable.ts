import ITable from '../ITable';

export interface CreateCompanyUserRole extends Omit<Model.UserRole, 'id' | 'createdOn' | 'modifiedOn'> {}

export default interface ICompanyTable extends ITable {
	columns: string[];
	getById: (id: number) => Promise<Api.Company.Res.Get>;
	getCompanyAndClientVariables: (id: number) => Promise<Api.Company.Res.GetCompanyAndClientVariables>;
	isDomainUnique: (rootDomain: string) => Promise<any>;
	getByDomain: (domain: string) => Promise<any>;
	getByName: (name: string) => Promise<any>;
	getByHostname: (hostname: string) => Promise<Model.Company>;
	getByVanityUrl: (hostname: string) => Promise<Model.Company>;
	getCompanyIds: () => Promise<{ id: number }[]>;
	getRedemptionRatio: () => Promise<number>;
	getEarnPointRatio: () => Promise<number>;
	getGateways: () => Promise<Model.CompanyGateway[]>;
	getClientGatewayPublic: () => Promise<Api.Payment.Res.PublicData>;
	createCompanyUserRole: (createData: CreateCompanyUserRole) => Promise<Model.UserRole>;
}
