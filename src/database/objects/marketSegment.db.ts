import Table from '../Table';

export default class MarketSegment extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}
}

export const marketSegment = (dbArgs) => {
	dbArgs.tableName = 'marketSegment';
	return new MarketSegment(dbArgs);
};
