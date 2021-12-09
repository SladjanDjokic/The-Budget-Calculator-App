import IUserAddressTable from '../interfaces/IUserAddressTable';
import TableMock from './table.db.mock';

export default class UserAddressTableMock extends TableMock implements IUserAddressTable {
	columns: string[];
	createCalls: number = 0;
	lastId: number = 0;

	constructor(public addresses: Model.UserAddress[] = []) {
		super();
		if (addresses.length) this.lastId = Math.max(...addresses.map((a) => a.id));
	}

	async create(tableObj: any): Promise<Model.UserAddress> {
		this.createCalls++;
		tableObj.id = ++this.lastId;
		this.addresses.push(tableObj);
		return tableObj;
	}
	async getById(objId: number): Promise<Model.UserAddress> {
		return this.addresses.find((a) => a.id === objId);
	}
	getManyByIds: (objIds: readonly number[], companyId?: number) => Promise<any>;
	update: (id: number, tableObj: any, companyId?: number) => Promise<any>;
	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	) => Promise<any>;
	delete: (id: number, companyId?: number) => Promise<number>;
	deleteMany: (ids: number[], companyId?: number) => Promise<any>;
}
