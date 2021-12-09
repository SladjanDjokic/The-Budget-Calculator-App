import ITable from '../ITable';

export default interface IAmenityTable extends ITable {
	getAllAmenities: () => Promise<Api.Amenity.Res.Get[]>;
	deleteForAccommodation: (accommodationId: number) => void;
	createAccommodationMapping: (accommodationId: number, amenityIds: number[]) => void;
}
