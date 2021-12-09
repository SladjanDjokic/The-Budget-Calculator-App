import Table from '../Table';
import { CustomPool } from '../../@types/mysqlCustom';
import IUserPointAllocationRecordTable, { UserPointBreakdown } from '../interfaces/IUserPointAllocationRecordTable';

export default class UserPointAllocationRecord extends Table implements IUserPointAllocationRecordTable {
	constructor(connection: CustomPool, tableName: string) {
		super({ connection, tableName });
	}

	getAvailablePointBreakdownByUserId(
		userId: number,
		minimumPointAvailability?: number
	): Promise<UserPointBreakdown[]> {
		let minimumPointsQueryString = minimumPointAvailability
			? ` AND (userPoint.pointAmount - IFNULL(userPointAllocationSummation.spentAmount,0)) > ${minimumPointAvailability}`
			: '';
		return this.db.runQuery(
			`WITH userPointAllocationSummation AS (
                SELECT userPointEarnedId, SUM(amount) spentAmount
                FROM userPointAllocationRecord
                GROUP BY userPointEarnedId
            )
             SELECT userPoint.id,
                    userPoint.status,
                    userPoint.pointType,
                    userPoint.pointAmount,
                    IFNULL(userPointAllocationSummation.spentAmount, 0) spentAmount,
                    IF((userPoint.pointAmount - IFNULL(userPointAllocationSummation.spentAmount,0)) > 0,
                       (userPoint.pointAmount - IFNULL(userPointAllocationSummation.spentAmount,0)), 0) availablePoints,
                    userPoint.reason,
                    userPoint.availableOn,
                    userPoint.expireOn
             FROM userPoint
                      LEFT JOIN userPointAllocationSummation ON userPointAllocationSummation.userPointEarnedId = userPoint.id
             WHERE userPoint.userId = ?
             	AND userPoint.status = 'RECEIVED'
				${minimumPointsQueryString}
			 ORDER BY id ASC;`,
			[userId]
		);
	}

	getPointAllocationForSpentPoints(userPointId: number): Promise<Model.UserPointAllocationRecord[]> {
		return this.db.runQuery(
			`SELECT * 
				FROM userPointAllocationRecord
				WHERE userPointSpentId=?;`,
			[userPointId]
		);
	}

	async rollBackSpentPoints(spentPointId: number): Promise<boolean> {
		const deleteResult = await this.db.runQuery(`DELETE FROM userPointAllocationRecord WHERE userPointSpentId=?`, [
			spentPointId
		]);
		return !!deleteResult.affectedRows;
	}
}
