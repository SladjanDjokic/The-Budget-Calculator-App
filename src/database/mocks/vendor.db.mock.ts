import IVendorView from '../interfaces/IVendorView';
import { TableArgs } from '../ITable';
import TableMock from './table.db.mock';

export default class VendorViewMock extends TableMock implements IVendorView {
	columns: string[];
	constructor(public readonly Vendors: Model.Vendor[]) {
		super();
	}

	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	) => Promise<Api.Vendor.Res.GetByPage>;
	create: (tableObj: TableArgs) => Promise<any>;
	getById: (objId: number, companyId?: number) => Promise<any>;
	getManyByIds: (objIds: number[], companyId?: number) => Promise<any>;
	update: (id: number, tableObj: any) => Promise<any>;
	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	delete: null;
	deleteMany: null;
}
