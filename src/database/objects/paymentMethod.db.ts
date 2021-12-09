import Table from '../Table';

export default class PaymentMethod extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}
}

export const paymentMethod = (dbArgs) => {
	dbArgs.tableName = 'userPaymentMethod';
	return new PaymentMethod(dbArgs);
};
