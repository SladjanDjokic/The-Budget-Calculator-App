import IAccommodationTypeTable from '../interfaces/IAccommodationTypeTable';
import TableMock from './table.db.mock';

export default class AccommodationTypeTableMock extends TableMock implements IAccommodationTypeTable {
	columns: string[];
	create: (tableObj: any, companyId?: number) => Promise<any>;
	getById: (objId: number, companyId: number) => Promise<any>;
	getManyByIds: (objIds: readonly number[], companyId?: number) => Promise<any>;
	update: (id: number, tableObj: any, companyId: number) => Promise<any>;
	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	) => Promise<any>;
	delete: (id: number, companyId?: number) => Promise<number>;
	deleteMany: (ids: number[], companyId?: number) => Promise<any>;
	forCompany: (companyId: number) => Promise<Model.AccommodationType[]>;
	getAllForDestination: (destinationId: number, companyId?: number) => Promise<Model.AccommodationType[]>;
	getAllForManyDestinations: (destinationIds: number[], companyId?: number) => Promise<Model.AccommodationType[]>;
}
