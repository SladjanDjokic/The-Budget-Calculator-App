import Table from '../Table';

export default class SystemActionLog extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}
}

export const systemActionLog = (dbArgs) => {
	dbArgs.tableName = 'systemActionLog';
	return new SystemActionLog(dbArgs);
};
