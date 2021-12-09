import Table from '../Table';

export default class PointRedemption extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}
}

export const pointRedemption = (dbArgs) => {
	dbArgs.tableName = 'pointRedemption';
	return new PointRedemption(dbArgs);
};
