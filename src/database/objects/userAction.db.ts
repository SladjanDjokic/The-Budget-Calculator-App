import Table from '../Table';
import mysql from 'mysql';
import { DateUtils, ObjectUtils } from '../../utils/utils';
import IUserActionTable from '../interfaces/IUserActionTable';

export default class UserAction extends Table implements IUserActionTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async createMany(userId: number, campaignActionIds: number[]): Promise<Model.UserAction[]> {
		const queryString = this.createManyQueryString(userId, campaignActionIds);
		const createdUserActions = await this.db.runQuery(queryString);
		const createdIds = ObjectUtils.isArrayWithData(createdUserActions)
			? createdUserActions.map((userAction) => {
					return userAction.insertId;
			  })
			: createdUserActions.insertId;
		return this.getManyByIds(createdIds);
	}

	async refundUserAction(userActionId: number): Promise<Model.UserAction> {
		await this.db.runQuery('UPDATE userAction SET refundedOn = ? WHERE id = ?;', [DateUtils.dbNow(), userActionId]);
		return this.db.queryOne('SELECT * FROM userAction WHERE id = ?;', [userActionId]);
	}

	async getByUserId(userId: number): Promise<Model.UserAction[]> {
		return await this.db.runQuery('SELECT * FROM userAction WHERE userId=?;', [userId]);
	}

	async updateManyForUser(userId: number, userActionIds: number[]): Promise<Model.UserAction[]> {
		await this.db.runQuery(
			'UPDATE userAction SET hasAwarded=1, modifiedOn=NOW() WHERE userId=? AND userAction.id IN (?);',
			[userId, userActionIds]
		);
		return await this.getManyByIds(userActionIds);
	}

	private createManyQueryString(userId: number, campaignActionIds: number[]): string {
		let queryList = [];
		for (let campaignActionId of campaignActionIds) {
			queryList.push(
				mysql.format(`INSERT INTO ${this.tableName} SET ?;`, [
					{ userId, campaignActionId, createdOn: DateUtils.dbNow() }
				])
			);
		}
		return queryList.join('');
	}
}

export const userAction = (dbArgs) => {
	dbArgs.tableName = 'userAction';
	return new UserAction(dbArgs);
};
