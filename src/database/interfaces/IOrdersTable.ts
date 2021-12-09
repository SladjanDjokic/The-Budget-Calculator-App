import ITable from '../ITable';

export default interface IOrdersTable extends ITable {
	getForUser: (userId: number) => Promise<Api.Order.Res.Get[]>;
}
