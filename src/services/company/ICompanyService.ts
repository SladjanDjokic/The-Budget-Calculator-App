import IService from '../IService';

export default interface ICompanyService extends IService {
	getVariables(companyId: number): Promise<Model.CompanyVariables>;
	getEarnPointRatio(): Promise<number>;
	getRedemptionPointRatio(): Promise<number>;
}
