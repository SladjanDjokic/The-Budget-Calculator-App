import TableMock from './table.db.mock';
import IOrdersTable from '../interfaces/IOrdersTable';

export default class OrdersTableMock extends TableMock implements IOrdersTable {
	orders: Api.Order.Res.Get[] = [];
	lastId: number = 0;

	constructor(prefillData?: Api.Order.Res.Get[]) {
		super();
		if (prefillData) this.orders = prefillData;
	}

	async getForUser(userId: number): Promise<Api.Order.Res.Get[]> {
		return this.orders.filter((order) => order.userId === userId);
	}
}
