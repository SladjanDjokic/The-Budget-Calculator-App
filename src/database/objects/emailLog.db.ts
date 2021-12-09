import Table from '../Table';

export default class EmailLog extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}
}

export const emailLog = (dbArgs) => {
	dbArgs.tableName = 'emailLog';
	return new EmailLog(dbArgs);
};
