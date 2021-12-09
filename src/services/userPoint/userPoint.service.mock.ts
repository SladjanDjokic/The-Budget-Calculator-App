import IUserPointService, { UserPointCreate } from './IUserPointService';
import RsPagedResponseData = RedSky.RsPagedResponseData;
import { ServiceName } from '../serviceFactory';
import { Service } from '../Service';
import UserService from '../user/user.service';
import { RsError } from '../../utils/errors';
import IUserPointTable from '../../database/interfaces/IUserPointTable';

export default class UserPointServiceMock implements IUserPointService {
	lastId = Date.now();
	userService: UserService;
	constructor(private readonly userPointTable: IUserPointTable) {}
	start(services: Partial<Record<ServiceName, Service>>) {
		this.userService = services['UserService'] as UserService;
	}

	async create(pointObj: UserPointCreate): Promise<Model.UserPoint> {
		if (!pointObj.pointType || !pointObj.pointAmount)
			throw new RsError('BAD_REQUEST', 'Missing user point properties');
		const createdPoints: Model.UserPoint = await this.userPointTable.create(pointObj);
		if (createdPoints) {
			if (createdPoints.status === 'RECEIVED')
				await this.userService.updatePoints(
					createdPoints.userId,
					createdPoints.pointAmount,
					createdPoints.status
				);
			else if (createdPoints.status !== 'PENDING') {
				await this.userService.updatePoints(
					createdPoints.userId,
					-createdPoints.pointAmount,
					createdPoints.status
				);
			}
		}
		return createdPoints;
	}

	getById(userPointId: number): Promise<Model.UserPoint> {
		return this.userPointTable.getById(userPointId);
	}

	getManyByIds(userPointIdList: number[]): Promise<Model.UserPoint[]> {
		return this.userPointTable.getManyByIds(userPointIdList);
	}

	getVerbosePointDetails(userId: number): Promise<Api.UserPoint.Res.Verbose[]> {
		return this.userPointTable.getVerbosePointsByUserId(userId);
	}

	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	) => Promise<RsPagedResponseData<Model.UserPoint[]>>;

	async getByUserId(userId: number): Promise<Model.UserPoint[]> {
		return this.userPointTable.getByUserId(userId);
	}

	async awardPoints(reservationId: number): Promise<Model.UserPoint> {
		const userPoint: Model.UserPoint = await this.userPointTable.getPendingByReservationId(reservationId);
		const updatedUserPoint = await this.userPointTable.update(userPoint.id, { status: 'RECEIVED' });
		await this.userService.updatePoints(
			updatedUserPoint.userId,
			updatedUserPoint.pointAmount,
			updatedUserPoint.status
		);
		return updatedUserPoint;
	}

	async createAndCalculateMultiplier(pointObj: UserPointCreate): Promise<Model.UserPoint> {
		return this.create({ ...pointObj, pointAmount: pointObj.pointAmount * 10 });
	}

	async revokePendingReservationPoints(reservationId: number): Promise<Model.UserPoint> {
		const point = await this.userPointTable.getPendingByReservationId(reservationId);
		if (!!!point) return null;
		return await this.userPointTable.update(point.id, { ...point, status: 'REVOKED' });
	}

	async cancelPendingReservationPoints(reservationId: number): Promise<Model.UserPoint> {
		const point = await this.userPointTable.getPendingByReservationId(reservationId);
		if (!!!point) return null;
		return await this.userPointTable.update(point.id, { ...point, status: 'CANCELED' });
	}
}
