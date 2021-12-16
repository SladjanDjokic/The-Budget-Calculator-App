import IServiceKeyTable, { ServiceKeyAndDetails, ServiceKeysAndDetails } from '../interfaces/IServiceKeyTable';
import TableMock from './table.db.mock';

export default class ServiceKeyTableMock extends TableMock implements IServiceKeyTable {
	columns: string[];
	async getServiceKeyAndCompanyDetails(serviceType: Model.ServiceKeyType): Promise<ServiceKeyAndDetails> {
		return {
			id: 1,
			isActive: 1,
			loyaltyStatus: 'PENDING',
			address: '',
			city: '',
			state: '',
			zip: '',
			country: '',
			description: '',
			name: '',
			privacyPolicyUrl: '',
			returnPolicyUrl: '',
			squareLogoUrl: '',
			termsConditionsUrl: '',
			vanityUrls: [],
			wideLogoUrl: '',
			createdOn: new Date(),
			modifiedOn: new Date(),
			serviceKey: 'mock',
			serviceName: 'mock',
			serviceType
		};
	}
	async getServiceKeysAndCompanyDetails(serviceType: Model.ServiceKeyType): Promise<ServiceKeysAndDetails> {
		return {
			id: 1,
			isActive: 1,
			loyaltyStatus: 'PENDING',
			address: '',
			city: '',
			state: '',
			zip: '',
			country: '',
			description: '',
			name: '',
			privacyPolicyUrl: '',
			returnPolicyUrl: '',
			squareLogoUrl: '',
			termsConditionsUrl: '',
			vanityUrls: [],
			wideLogoUrl: '',
			createdOn: new Date(),
			modifiedOn: new Date(),
			services: [{ serviceKey: 'mock', serviceName: 'mock', serviceType }]
		};
	}
	create: (tableObj: any) => Promise<any>;
	getById: (objId: number, companyId?: number) => Promise<any>;
	getManyByIds: (objIds: readonly number[], companyId?: number) => Promise<any>;
	update: (id: number, tableObj: any, companyId?: number) => Promise<any>;
	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	) => Promise<any>;
	delete: null;
	deleteMany: null;
}
