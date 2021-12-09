import TableMock from './table.db.mock';
import IAmenityTable from '../interfaces/IAmenityTable';

export default class AmenityTableMock extends TableMock implements IAmenityTable {
	amenities: Model.Amenity[];
	accommodationAmenities: Model.AccommodationAmenity[];
	constructor(prefillAmenities?: Model.Amenity[], accommodationAmenities?: Model.AccommodationAmenity[]) {
		super();
		if (prefillAmenities) this.amenities = prefillAmenities;
		if (accommodationAmenities) this.accommodationAmenities = accommodationAmenities;
	}

	async createAccommodationMapping(accommodationId: number, amenityIds: number[]): Promise<void> {
		this.accommodationAmenities = [
			...this.accommodationAmenities,
			...amenityIds.map((amenityId) => {
				return { accommodationId, amenityId };
			})
		];
	}

	async deleteForAccommodation(accommodationId: number): Promise<void> {
		this.accommodationAmenities = this.accommodationAmenities.filter(
			(amenity) => amenity.accommodationId !== accommodationId
		);
	}

	async getAllAmenities(): Promise<Api.Amenity.Res.Get[]> {
		return this.amenities;
	}
}
