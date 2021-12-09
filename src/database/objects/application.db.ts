import Table from '../Table';

export default class Application extends Table {
	constructor(db_args) {
		super(db_args);
	}
}

export const application = (dbArgs) => {
	dbArgs.tableName = 'application';
	return new Application(dbArgs);
};
