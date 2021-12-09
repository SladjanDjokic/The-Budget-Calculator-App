import IAccommodationTable from '../interfaces/IAccommodationTable';
import TableMock from './table.db.mock';

export default class AccommodationTableMock extends TableMock implements IAccommodationTable {
	columns: string[];
	constructor(public readonly accommodations: Model.Accommodation[]) {
		super();
	}

	getAvailableByIds(
		availableAccommodationIds: number[],
		propertyTypeIds?: number[],
		bedroomCount?: number,
		bathroomCount?: number,
		companyId?: number
	): Api.Accommodation.Res.Availability[] | PromiseLike<Api.Accommodation.Res.Availability[]> {
		throw new Error('Method not implemented.');
	}
	getAccommodationDetails(accommodationId: number, companyId?: number): Promise<Api.Accommodation.Res.Details> {
		throw new Error('Method not implemented.');
	}
	allForCompany: (companyId: number) => Promise<Model.Accommodation[]>;
	create: (tableObj: any, companyId?: number) => Promise<any>;
	async getById(objId: number, companyId?: number): Promise<any> {
		return this.accommodations.find((a) => a.id === objId && (!!!companyId || a.companyId === companyId));
	}
	async forExternalId(externalId: string, companyId?: number): Promise<Model.Accommodation> {
		return this.accommodations.find((a) => a.companyId === companyId && a.externalSystemId === externalId);
	}
	getManyByIds: (objIds: readonly number[], companyId?: number) => Promise<any>;
	update: (id: number, tableObj: any, companyId: number) => Promise<any>;
	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	updateInternal: (accommodationId: number, updateData: Partial<Model.Accommodation>) => Promise<void>;
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	) => Promise<any>;
	delete: (id: number, companyId?: number) => Promise<number>;
	deleteMany: (ids: number[], companyId?: number) => Promise<any>;
}
