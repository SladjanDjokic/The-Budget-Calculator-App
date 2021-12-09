import Table from '../Table';

export default class Segment extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}
}

export const segment = (dbArgs) => {
	dbArgs.tableName = 'segment';
	return new Segment(dbArgs);
};
