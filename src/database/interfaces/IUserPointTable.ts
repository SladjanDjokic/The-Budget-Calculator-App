import ITable from '../ITable';

export default interface IUserPointTable extends ITable {
	getByUserId: (userId: number) => Promise<Model.UserPoint[]>;
	getPendingByReservationId: (reservationId: number) => Promise<Model.UserPoint>;
	getByReservationId: (reservationId: number) => Promise<Model.UserPoint>;
	getVerbosePointsByUserId: (userId: number) => Promise<Api.UserPoint.Res.Verbose[]>;
}
