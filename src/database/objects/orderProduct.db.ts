import Table from '../Table';

export default class OrderProduct extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}
}

export const orderProduct = (dbArgs) => {
	dbArgs.tableName = 'orderProduct';
	return new OrderProduct(dbArgs);
};
