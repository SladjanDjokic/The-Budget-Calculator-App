import { CustomPool } from '../@types/mysqlCustom';

export default class DatabaseUtil {
	db: CustomPool;
	columns: {};

	constructor(connection: CustomPool) {
		this.db = connection;
		this.columns = {};
	}

	async init(tables) {
		let promises = [];
		for (let i in tables) {
			if (i) promises.push(this.getColumns(i));
		}
		await Promise.all(promises);
	}

	async getColumns(tableName) {
		if (this.columns[tableName]) {
			return this.columns[tableName];
		}
		const sql = 'SHOW COLUMNS FROM `' + tableName + '`;';
		let rows = await this.db.runQuery(sql);
		let columns = [];
		for (let i in rows) {
			const row = rows[i];
			columns.push(row.Field);
		}
		this.columns[tableName] = columns;
		return columns;
	}

	get(tableName) {
		return this.columns[tableName];
	}

	tableColumns(tableName) {
		return this.columns[tableName];
	}
}

let db: DatabaseUtil = null;

export const dbUtils = (connection: CustomPool): DatabaseUtil => {
	if (!db) {
		db = new DatabaseUtil(connection);
	}
	return db;
};
