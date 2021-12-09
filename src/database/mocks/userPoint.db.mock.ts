import TableMock from './table.db.mock';
import IUserPointTable from '../interfaces/IUserPointTable';
import { UserPointCreate } from '../../services/userPoint/IUserPointService';
import { userPoint } from '../objects/userPoint.db';

export default class UserPointTableMock extends TableMock implements IUserPointTable {
	constructor(public readonly userPoints: Model.UserPoint[] = []) {
		super();
	}

	async create(pointObj: UserPointCreate) {
		const userPointToCreate: Model.UserPoint = {
			availableOn: undefined,
			campaignId: pointObj.campaignId || null,
			campaignActionId: pointObj.campaignActionId || null,
			createdOn: undefined,
			description: '',
			expireOn: undefined,
			id: 0,
			modifiedOn: undefined,
			notes: '',
			orderId: pointObj.orderId || null,
			pointAmount: pointObj.pointAmount,
			pointType: pointObj.pointType,
			reason: pointObj.reason,
			reservationId: pointObj.reservationId || null,
			rewardVoucherId: pointObj.rewardVoucherId || null,
			status: pointObj.status,
			userActionId: 0,
			userId: pointObj.userId
		};
		this.userPoints.push(userPointToCreate);
		return userPointToCreate;
	}

	async update(id: number, tableObj: any, companyId?: number): Promise<any> {
		const index = this.userPoints.findIndex((userPoint) => userPoint.id === id);
		this.userPoints[index] = { ...this.userPoints[index], ...tableObj };
		return this.userPoints[index];
	}

	async getByReservationId(reservationId: number): Promise<Model.UserPoint> {
		return this.userPoints.find((userPoint) => userPoint.reservationId === reservationId);
	}

	async getByUserId(userId: number): Promise<Model.UserPoint[]> {
		return this.userPoints.filter((userPoint) => userPoint.userId === userId);
	}

	async getPendingByReservationId(reservationId: number): Promise<Model.UserPoint> {
		return this.userPoints.find(
			(userPoint) => userPoint.status === 'PENDING' && userPoint.reservationId === reservationId
		);
	}

	async getVerbosePointsByUserId(userId: number): Promise<Api.UserPoint.Res.Verbose[]> {
		const response: Api.UserPoint.Res.Verbose[] = [];
		for (let index in this.userPoints) {
			if (this.userPoints[index].userId !== userId) continue;
			response.push({
				...this.userPoints[index],
				title: 'This is a title',
				arrivalDate: null,
				departureDate: null,
				media: null
			});
		}
		return response;
	}
}
