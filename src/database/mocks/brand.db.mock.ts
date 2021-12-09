import { RsError } from '../../utils/errors';
import { ObjectUtils } from '../../utils/utils';
import IBrandTable from '../interfaces/IBrandTable';
import TableMock from './table.db.mock';

export default class BrandTableMock extends TableMock implements IBrandTable {
	getForCompanyCalls: number = 0;
	constructor(public readonly Brands: Model.Brand[]) {
		super();
	}
	columns: string[];

	create: (tableObj: any) => Promise<any>;
	async getAll() {
		return ObjectUtils.deepClone(this.Brands);
	}
	async getById(brandId: number): Promise<Model.Brand> {
		return this.Brands.find((a) => a.id === brandId);
	}
	async getAllForCompany(companyId: number): Promise<Model.Brand[]> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}
	getManyByIds: (objIds: number[]) => Promise<any>;
	getByPage: null;
	update: (id: number, tableObj: any) => Promise<any>;
	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	delete: null;
	deleteMany: null;
}
