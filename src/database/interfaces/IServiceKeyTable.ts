import ITable from '../ITable';

export interface ServiceInfo {
	serviceName: string;
	serviceType: string;
	serviceKey: any;
}

export interface ServiceKeyAndDetails extends Model.Company, ServiceInfo {}

export interface ServiceKeysAndDetails extends Model.Company {
	services: ServiceInfo[];
}

export default interface IServiceKeyTable extends ITable {
	getServiceKeyAndCompanyDetails: (
		serviceType: Model.ServiceKeyType,
		companyId?: number
	) => Promise<ServiceKeyAndDetails>;
	getServiceKeysAndCompanyDetails: (
		serviceType: Model.ServiceKeyType,
		companyId?: number
	) => Promise<ServiceKeysAndDetails>;
	delete: null;
	deleteMany: null;
}
