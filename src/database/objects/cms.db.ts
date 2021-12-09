import Table from '../Table';

export default class Cms extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}
}

export const cms = (dbArgs) => {
	dbArgs.tableName = 'cms';
	return new Cms(dbArgs);
};
