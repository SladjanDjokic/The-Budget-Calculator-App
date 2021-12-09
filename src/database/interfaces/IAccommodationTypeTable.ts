import ITable from '../ITable';

export default interface IAccommodationTypeTable extends ITable {
	forCompany: (companyId: number) => Promise<Model.AccommodationType[]>;
	getAllForDestination: (id: number, companyId?: number) => Promise<Model.AccommodationType[]>;
	getAllForManyDestinations: (destinationIds: number[], companyId?: number) => Promise<Model.AccommodationType[]>;
}
