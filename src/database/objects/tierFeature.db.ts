import Table from '../Table';

export default class TierFeature extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getAll(): Promise<Model.TierFeature[]> {
		return this.db.runQuery('SELECT * FROM tierFeature;', []);
	}
}

export const tierFeature = (dbArgs) => {
	dbArgs.tableName = 'tierFeature';
	return new TierFeature(dbArgs);
};
