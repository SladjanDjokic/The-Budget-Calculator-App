import ITable from '../ITable';

export default interface IDestinationTable extends ITable {
	getForCompany: (companyId: number) => Promise<Model.Destination[]>;
	getDestinationDetails: (destinationId: number, companyId?: number) => Promise<Api.Destination.Res.Details>;
	getPropertyTypes: (destinationId: number) => Promise<Api.Destination.Res.PropertyType[]>;
	getAllPropertyTypes(): Promise<Api.Destination.Res.PropertyType[]>;
	updatePropertyTypes: (DestinationId: number, propertyTypes: number[]) => void;
	updateDestinationRegions: (destinationId: number, regions: number[]) => void;
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter?: RedSky.FilterQuery,
		companyId?: number
	) => Promise<RedSky.RsPagedResponseData<Api.Destination.Res.Details[]>>;
	getById: (destinationId: number, companyId?: number) => Promise<Model.Destination>;
	getAvailable: (
		destinationIds: number[],
		propertyTypeIds?: number[],
		regionIds?: number[],
		bedroomCount?: number,
		bathroomCount?: number,
		companyId?: number
	) => Promise<Api.Destination.Res.Availability[]>;
	delete: null;
	deleteMany: null;
}
