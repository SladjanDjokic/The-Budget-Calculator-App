import Table from '../Table';

export default class Media extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async forType(user, type, itemId) {
		let rowType = { [type]: itemId };
		try {
			return await this.db.queryOne('Select * from media where ?;', [rowType]);
		} catch (e) {
			return false;
		}
	}

	async for_general_media(user) {
		return await this.db.runQuery(
			'Select * from media where general_media=1 and companyId=? order by order_priority;',
			[user.companyId]
		);
	}

	async forCompany(companyId: number) {
		return await this.db.runQuery(`SELECT * FROM media WHERE companyId=?;`, [companyId]);
	}
}

export const media = (db_args) => {
	db_args.tableName = 'media';
	return new Media(db_args);
};
