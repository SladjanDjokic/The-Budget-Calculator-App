import IUserPermissionTable from '../interfaces/IUserPermissionTable';
import Table from '../Table';

export default class UserPermission extends Table implements IUserPermissionTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async create(tableObj: Model.UserPermission) {
		await this.db.runQuery('INSERT INTO userPermission SET ?;', [tableObj]);
		return await this.db.queryOne('SELECT * FROM userPermission WHERE userId=? AND `key`=?', [
			tableObj.userId,
			tableObj.key
		]);
	}

	async deleteForUser(userId: number) {
		return await this.db.runQuery('DELETE FROM userPermission WHERE userId=?;', [userId]);
	}

	delete: null;
	deleteMany: null;
}

export const userPermission = (dbArgs) => {
	dbArgs.tableName = 'userPermission';
	return new UserPermission(dbArgs);
};
