import ICompanyVariablesTable from '../interfaces/ICompanyVariablesTable';
import TableMock from './table.db.mock';

export default class CompanyVariablesTableMock extends TableMock implements ICompanyVariablesTable {
	constructor() {
		super();
	}

	columns: ['companyId', 'ap2FactorLoginTimeoutDays', 'ap2FactorLoginVerificationTimeoutHours'];

	getById: (companyId: number) => Promise<Api.Company.Res.Get>;
	create: (tableObj: any, companyId?: number) => Promise<any>;
	getManyByIds: (objIds: readonly number[], companyId?: number) => Promise<any>;
	update: (companyId: number, tableObj: Omit<Partial<Model.CompanyVariables>, 'companyId'>) => Promise<boolean>;
	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	) => Promise<any>;
	delete: (id: number, companyId?: number) => Promise<number>;
	deleteMany: (ids: number[], companyId?: number) => Promise<any>;

	getByCompanyId() {
		return null;
	}
}
