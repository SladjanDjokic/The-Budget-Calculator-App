import Table from '../Table';
import { accommodation } from './accommodation.db';
import IAmenityTable from '../interfaces/IAmenityTable';

export default class Amenity extends Table implements IAmenityTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getAllAmenities(): Promise<Api.Amenity.Res.Get[]> {
		return this.db.runQuery('SELECT * FROM amenity;');
	}

	async deleteForAccommodation(accommodationId: number) {
		await this.db.runQuery('DELETE FROM accommodationAmenity WHERE accommodationId = ?;', [accommodationId]);
	}

	async createAccommodationMapping(accommodationId: number, amenityIds: number[]) {
		await this.db.runQuery('INSERT INTO accommodationAmenity (accommodationId, amenityId) VALUES ?', [
			amenityIds.map((amenityId) => [accommodationId, amenityId])
		]);
	}
}

export const amenity = (dbArgs) => {
	dbArgs.tableName = 'amenity';
	return new Amenity(dbArgs);
};
