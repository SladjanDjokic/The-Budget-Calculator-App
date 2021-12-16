import { Service } from '../Service';
import UserPoint from '../../database/objects/userPoint.db';
import { RsError } from '../../utils/errors';
import UserService from '../user/user.service';
import IUserPointService, { UserPointCreate } from './IUserPointService';
import RsPagedResponseData = RedSky.RsPagedResponseData;
import logger from '../../utils/logger';
import ICompanyService from '../company/ICompanyService';
import IUserTable from '../../database/interfaces/IUserTable';
import { ServiceName } from '../serviceFactory';
import CompanyService from '../company/company.service';
import IUserPointAllocationRecordTable, {
	UserPointBreakdown
} from '../../database/interfaces/IUserPointAllocationRecordTable';
import { ObjectUtils } from '../../utils/utils';

export default class UserPointService extends Service implements IUserPointService {
	companyService: ICompanyService;
	userService: UserService;

	constructor(
		public readonly userPointTable: UserPoint,
		private readonly userTable: IUserTable,
		private readonly userPointAllocationRecordTable: IUserPointAllocationRecordTable
	) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.companyService = services['CompanyService'] as CompanyService;
		this.userService = services['UserService'] as UserService;
	}

	async create(pointObj: UserPointCreate): Promise<Model.UserPoint> {
		const requiresAllocationStatus: Omit<Model.UserPointStatusTypes, 'PENDING' | 'RECEIVED'>[] = [
			'REVOKED',
			'EXPIRED',
			'REDEEMED',
			'CANCELED',
			'REFUNDED'
		];
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
			if (requiresAllocationStatus.includes(createdPoints.status)) {
				await this.generateFirstInFirstOutPointAllocation(createdPoints);
			}
		}
		return createdPoints;
	}

	async createAndCalculateMultiplier(pointObj: UserPointCreate): Promise<Model.UserPoint> {
		let pointsToEarn = await this.calculateMultiplier(pointObj);
		return this.create({ ...pointObj, pointAmount: pointsToEarn });
	}

	async calculateMultiplier(pointObj: UserPointCreate): Promise<number> {
		let tierAccrualRate = 1;
		if (!!pointObj.userId) {
			try {
				tierAccrualRate = await this.userService.getTierMultiplierForUser(pointObj.userId);
			} catch (e) {
				logger.warn(`Failed to get tier accrual rate, using default of 1`, pointObj);
			}
		}
		// get global ratio (currently 10:1)
		const globalEarningRate: number = await this.companyService.getEarnPointRatio();
		// multiply by tier multiplier
		const earningRate = tierAccrualRate * globalEarningRate;
		// Apply multiplier to points, round, and return
		return Math.floor((pointObj.pointAmount * earningRate) / 100);
	}

	getById(userPointId: number): Promise<Model.UserPoint> {
		return this.userPointTable.getById(userPointId);
	}

	getManyByIds(userPointIdList: number[]): Promise<Model.UserPoint[]> {
		return this.userPointTable.getManyByIds(userPointIdList);
	}

	getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	): Promise<RsPagedResponseData<Model.UserPoint[]>> {
		return this.userPointTable.getByPage(pagination, sort, filter);
	}

	getByUserId(userId: number): Promise<Model.UserPoint[]> {
		return this.userPointTable.getByUserId(userId);
	}

	getVerbosePointDetails(userId: number): Promise<Api.UserPoint.Res.Verbose[]> {
		return this.userPointTable.getVerbosePointsByUserId(userId);
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

	async revokePendingReservationPoints(reservationId: number): Promise<Model.UserPoint> {
		const pointTableResult: Model.UserPoint = await this.userPointTable.getPendingByReservationId(reservationId);
		if (!pointTableResult) return null;
		return this.userPointTable.update(pointTableResult.id, { status: 'REVOKED' });
	}

	async cancelPendingReservationPoints(reservationId: number): Promise<Model.UserPoint> {
		const pointTableResult: Model.UserPoint = await this.userPointTable.getByReservationId(reservationId);
		const userTableResult: Api.User.Filtered = await this.userTable.getById(pointTableResult.userId);
		if (!pointTableResult || !userTableResult) return null;
		const availablePoints = userTableResult.availablePoints + pointTableResult.pointAmount;
		await this.userTable.update(userTableResult.id, { availablePoints });
		return this.userPointTable.update(pointTableResult.id, {
			status: 'REFUNDED',
			reason: 'Reservation Cancellation',
			pointType: 'BOOKING',
			pointAmount: pointTableResult.pointAmount
		});
	}

	getPointAllocationByUserPointId(userPointId: number): Promise<Model.UserPointAllocationRecord[]> {
		return this.userPointAllocationRecordTable.getPointAllocationForSpentPoints(userPointId);
	}

	private async generateFirstInFirstOutPointAllocation(createdPoints: Model.UserPoint): Promise<void> {
		let remainingPointsToAllocate: number = createdPoints.pointAmount;
		const pointLimitRequirement = 1;
		const availablePointBreakdown: UserPointBreakdown[] = await this.userPointAllocationRecordTable.getAvailablePointBreakdownByUserId(
			createdPoints.userId,
			pointLimitRequirement
		);
		if (!ObjectUtils.isArrayWithData(availablePointBreakdown))
			throw new RsError('INVALID_PAYMENT', 'Unable to find available points for payment allocation');
		for (let availablePoints of availablePointBreakdown) {
			if (!remainingPointsToAllocate || remainingPointsToAllocate <= 0) break;
			if (availablePoints.availablePoints === 0) continue;
			if (remainingPointsToAllocate >= availablePoints.availablePoints) {
				await this.userPointAllocationRecordTable.create({
					userPointEarnedId: availablePoints.id,
					userPointSpentId: createdPoints.id,
					amount: availablePoints.availablePoints
				});
			} else {
				await this.userPointAllocationRecordTable.create({
					userPointEarnedId: availablePoints.id,
					userPointSpentId: createdPoints.id,
					amount: Number(availablePoints.availablePoints - remainingPointsToAllocate)
				});
			}
			remainingPointsToAllocate = remainingPointsToAllocate - availablePoints.availablePoints;
		}
		if (remainingPointsToAllocate > 0) {
			logger.error(`Points are still remaining to be allocated and no more are available to allocate`, {
				remainingPointsToAllocate,
				availablePointBreakdown,
				createdPoints
			});
			await this.userPointAllocationRecordTable.rollBackSpentPoints(createdPoints.id);
			throw new RsError(
				'INVALID_PAYMENT',
				'Points are still remaining to be allocated and no more are available to allocate'
			);
		}
	}
}
