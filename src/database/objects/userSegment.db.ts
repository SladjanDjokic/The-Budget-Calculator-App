import Table from '../Table';

export default class UserSegment extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}
}

export const userSegment = (dbArgs) => {
	dbArgs.tableName = 'userSegment';
	return new UserSegment(dbArgs);
};
