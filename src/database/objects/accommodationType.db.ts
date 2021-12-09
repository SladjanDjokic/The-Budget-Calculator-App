import IAccommodationTypeTable from '../interfaces/IAccommodationTypeTable';
import Table from '../Table';

export default class AccommodationType extends Table implements IAccommodationTypeTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getAllForDestination(destinationId: number, companyId?: number): Promise<Model.AccommodationType[]> {
		return await this.db.runQuery(
			`SELECT * FROM accommodationType WHERE destinationId=? AND ${Table.buildCompanyIdQuery(companyId)};`,
			[destinationId, companyId]
		);
	}

	async getAllForManyDestinations(destinationIds: number[], companyId?: number): Promise<Model.AccommodationType[]> {
		return await this.db.runQuery(
			`SELECT * FROM accommodationType WHERE destinationId IN (?) AND ${Table.buildCompanyIdQuery(companyId)};`,
			[destinationIds, companyId]
		);
	}

	async forCompany(companyId: number) {
		return await this.db.runQuery(`SELECT * FROM accommodationType WHERE companyId=?;`, [companyId]);
	}
}

export const accommodationType = (dbArgs) => {
	dbArgs.tableName = 'accommodationType';
	return new AccommodationType(dbArgs);
};
