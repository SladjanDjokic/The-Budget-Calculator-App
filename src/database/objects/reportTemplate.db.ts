import Table from '../Table';

export default class ReportTemplate extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}
}

export const reportTemplate = (dbArgs) => {
	dbArgs.tableName = 'reportTemplate';
	return new ReportTemplate(dbArgs);
};
