import ITable from '../ITable';

export default class TableMock implements ITable {
	db: any;
	columns: string[];
	async create(tableObj: any, companyId?: number): Promise<any> {}
	async getById(objId: number, companyId?: number): Promise<any> {}
	async getManyByIds(objIds: readonly number[], companyId?: number): Promise<any> {}
	async update(id: number, tableObj: any, companyId?: number): Promise<any> {}
	async updateMany(ids: number[], tableObj: any): Promise<any> {}
	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<any> {}
	delete(id: number, companyId?: number): Promise<number> {
		return;
	}
	deleteMany(ids: number[], companyId?: number): Promise<any> {
		return;
	}
}
