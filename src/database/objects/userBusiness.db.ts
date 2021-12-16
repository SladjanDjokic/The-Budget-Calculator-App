import Table from '../Table';
import IUserBusinessTable from '../interfaces/IUserBusinessTable';

export default class UserBusiness extends Table implements IUserBusinessTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getByUserId(userId: number): Promise<Model.UserBusiness[]> {
		return await this.db.runQuery(`SELECT * FROM userBusiness WHERE userId=?`, [userId]);
	}
}

export const userBusiness = (dbArgs) => {
	dbArgs.tableName = 'userBusiness';
	return new UserBusiness(dbArgs);
};
