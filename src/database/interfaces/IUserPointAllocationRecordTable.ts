import ITable from '../ITable';

export interface Create {
	userPointEarnedId: number;
	userPointSpentId: number;
	amount: number;
}

export interface UserPointBreakdown {
	id: number;
	status: Model.UserPointStatusTypes;
	pointAmount: number;
	spentAmount: number;
	availablePoints: number;
	reason: Model.PointReason;
	availableOn: Date | string;
	expireOn: Date | string;
}

export default interface IUserPointAllocationRecordTable extends ITable {
	getAvailablePointBreakdownByUserId(
		userId: number,
		minimumPointAvailability?: number
	): Promise<UserPointBreakdown[]>;
	getPointAllocationForSpentPoints(userPointId: number): Promise<Model.UserPointAllocationRecord[]>;
	rollBackSpentPoints(spentPointId: number): Promise<boolean>;
}
