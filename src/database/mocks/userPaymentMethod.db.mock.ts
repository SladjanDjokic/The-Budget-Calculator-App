import IUserPaymentMethodTable, { Properties } from '../interfaces/IUserPaymentMethodTable';
import TableMock from './table.db.mock';

export default class UserPaymentMethodTableMock extends TableMock implements IUserPaymentMethodTable {
	columns: string[];

	constructor(public readonly paymentMethods: { [id: number]: Model.UserPaymentMethod } = {}) {
		super();
	}
	create: (tableObj: any, companyId?: number) => Promise<any>;
	async getById(objId: number): Promise<Model.UserPaymentMethod> {
		return this.paymentMethods[objId];
	}
	getManyByIds: (objIds: readonly number[], companyId?: number) => Promise<any>;
	getByProperties: ({ userId, ...properties }: Properties) => Promise<Model.UserPaymentMethod[]>;
	update: (id: number, tableObj: any) => Promise<any>;
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
