import Database from './database';

class DbSingleton {
	databaseSingleton: Database;
	constructor() {
		this.databaseSingleton = null;
	}

	create(connection, meta_tools) {
		this.databaseSingleton = new Database(connection, meta_tools);
	}

	get() {
		if (this.databaseSingleton === null) throw new Error('Trying to get database singleton when it is set to NULL');
		return this.databaseSingleton;
	}
}

let dbSingleton = new DbSingleton();
export default dbSingleton;
