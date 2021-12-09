import TableMock from './table.db.mock';
import IUserPointAllocationRecordTable, { UserPointBreakdown } from '../interfaces/IUserPointAllocationRecordTable';

export default class UserPointAllocationRecordTableMock extends TableMock implements IUserPointAllocationRecordTable {
	constructor(
		private readonly userPoints: Model.UserPoint[] = [],
		private userPointAllocationRecords: Model.UserPointAllocationRecord[] = []
	) {
		super();
	}

	async getAvailablePointBreakdownByUserId(
		userId: number,
		minimumPointAvailability?: number
	): Promise<UserPointBreakdown[]> {
		const formattedResult: UserPointBreakdown[] = [];
		const usersPoints: Model.UserPoint[] = this.getUsersPoints(userId);
		for (let points of usersPoints) {
			const allocatedTotal: number = this.getPointAllocationSummation(points);
			formattedResult.push({
				id: points.id,
				status: points.status,
				pointAmount: points.pointAmount,
				spentAmount: allocatedTotal,
				availablePoints: points.pointAmount - allocatedTotal ? points.pointAmount - allocatedTotal : 0,
				reason: points.reason,
				availableOn: points.availableOn,
				expireOn: points.expireOn
			});
		}
		return formattedResult;
	}

	async getPointAllocationForSpentPoints(userPointId: number): Promise<Model.UserPointAllocationRecord[]> {
		return this.userPointAllocationRecords.filter((userPoint) => {
			return (userPoint.userPointEarnedId = userPointId);
		});
	}

	async rollBackSpentPoints(spentPointId: number): Promise<boolean> {
		this.userPointAllocationRecords.filter((userPoint) => {
			return userPoint.userPointSpentId !== spentPointId;
		});
		return true;
	}

	private getUsersPoints(userId: number): Model.UserPoint[] {
		return this.userPoints.filter((userPoints) => {
			return userPoints.userId === userId;
		});
	}

	private getPointAllocationSummation(point: Model.UserPoint): number {
		return this.userPointAllocationRecords.reduce((accumulator, allocationRecord) => {
			if (allocationRecord.userPointSpentId != point.id) return accumulator;
			return accumulator + allocationRecord.amount;
		}, 0);
	}
}
