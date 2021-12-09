import Table from '../Table';

export interface CreateLayoutRoom extends Api.AccommodationLayoutRoom.Req.Create {
	companyId: number;
}

export default class AccommodationLayoutRoom extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getByLayoutId(layoutId: number): Promise<Model.AccommodationLayoutRoom[]> {
		return await this.db.runQuery('SELECT * FROM accommodationLayoutRoom where accommodationLayoutId=?;', [
			layoutId
		]);
	}
}

export const accommodationLayoutRoom = (dbArgs) => {
	dbArgs.tableName = 'accommodationLayoutRoom';
	return new AccommodationLayoutRoom(dbArgs);
};
