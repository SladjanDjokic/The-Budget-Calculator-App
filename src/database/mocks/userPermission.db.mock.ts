import { ObjectUtils } from '../../utils/utils';
import IUserPermissionTable from '../interfaces/IUserPermissionTable';
import TableMock from './table.db.mock';

export default class UserPermissionTableMock extends TableMock implements IUserPermissionTable {
	columns: string[];
	createCalls: number = 0;

	constructor(public permissions: Model.UserPermission[] = []) {
		super();
	}
	async create(tableObj: Model.UserPermission): Promise<any> {
		this.createCalls++;
		this.permissions.push(tableObj);
		return true;
	}
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
	async deleteForUser(userId: number): Promise<Model.UserPermission[]> {
		return ObjectUtils.pruneInPlace(this.permissions, (p) => p.userId === userId);
	}
}
