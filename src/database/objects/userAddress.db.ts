import IUserAddressTable from '../interfaces/IUserAddressTable';
import Table from '../Table';
import mysql from 'mysql';

export default class UserAddress extends Table implements IUserAddressTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async create(userAddress: Api.UserAddress.Req.Create): Promise<Model.UserAddress> {
		if (!userAddress.isDefault) {
			const result = await this.db.runQuery('INSERT INTO userAddress SET ?;', [userAddress]);
			return this.getById(result.insertId);
		} else {
			const typeQuery = this.getTypeQuery(userAddress);
			const result = await this.db.runQuery(
				`UPDATE userAddress SET isDefault=0 WHERE userId=? ${typeQuery};INSERT INTO userAddress SET ?;`,
				[userAddress.userId, userAddress]
			);
			return this.getById(result[1].insertId);
		}
	}

	async update(userAddressId: number, userAddressObj: Api.UserAddress.Req.Update): Promise<Model.UserAddress> {
		if (!userAddressObj.isDefault) {
			return super.update(userAddressId, userAddressObj);
		}
		await this.db.runQuery(
			`UPDATE userAddress SET isDefault=0 WHERE userId=(SELECT userId FROM userAddress where id=?);UPDATE userAddress SET ? WHERE id=?;`,
			[userAddressId, userAddressObj, userAddressId]
		);
		return this.getById(userAddressId);
	}

	private getTypeQuery(userAddress: Api.UserAddress.Req.Create | Api.UserAddress.Req.Update): string {
		if (userAddress.isDefault && userAddress.type === 'BOTH') {
			return '';
		}
		return mysql.format("AND (type=? OR type='BOTH')", [userAddress.type]);
	}
}

export const userAddress = (dbArgs) => {
	dbArgs.tableName = 'userAddress';
	return new UserAddress(dbArgs);
};
