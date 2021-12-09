import Table from '../Table';

export default class BookingSource extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}
}

export const bookingSource = (dbArgs) => {
	dbArgs.tableName = 'bookingSource';
	return new BookingSource(dbArgs);
};
