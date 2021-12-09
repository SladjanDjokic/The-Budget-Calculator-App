import Table from '../Table';
import { RsError } from '../../utils/errors';
import IUserPaymentMethodTable, {
	Create,
	Properties,
	UserPaymentMethodToUpdate
} from '../interfaces/IUserPaymentMethodTable';
import mysql from 'mysql';
import logger from '../../utils/logger';

export default class UserPaymentMethod extends Table implements IUserPaymentMethodTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async create(tableObj: Create): Promise<Model.UserPaymentMethod> {
		let setPrimaryQuery: string =
			'isPrimary' in tableObj && tableObj.isPrimary
				? `UPDATE userPaymentMethod SET isPrimary=0 WHERE userId=${tableObj.userId};`
				: '';
		tableObj = Table.columnObjectStringify(tableObj);
		const result = await this.db.runQuery(`${setPrimaryQuery}INSERT INTO ${this.tableName} SET ?;`, [tableObj]);
		return await this.getById(setPrimaryQuery ? result[1].insertId : result.insertId);
	}

	getActiveByUserId(userId: number): Promise<Model.UserPaymentMethod> {
		return this.db.queryOne('SELECT * FROM userPaymentMethod WHERE isDeleted=0 AND userId=?;', [userId]);
	}

	async delete(userPaymentMethodId: number): Promise<number> {
		const payment: Model.UserPaymentMethod = await this.db.queryOne('SELECT * FROM userPaymentMethod WHERE id=?;', [
			userPaymentMethodId
		]);
		await this.db.runQuery(
			`UPDATE userPaymentMethod 
				SET isDeleted = 1
				WHERE userId=? 
					AND nameOnCard=? 
					AND type=? 
					AND last4=? 
					AND expirationMonth=? 
					AND expirationyear=?;`,
			[
				payment.userId,
				payment.nameOnCard,
				payment.type,
				payment.last4,
				payment.expirationMonth,
				payment.expirationYear
			]
		);
		return userPaymentMethodId;
	}

	async update(userPaymentMethodId: number, paymentObj: UserPaymentMethodToUpdate): Promise<Model.UserPaymentMethod> {
		const metaDataQuery: string = !!paymentObj.metaData ? mysql.format(`, metaData=?`, [paymentObj.metaData]) : '';
		if ('isPrimary' in paymentObj && paymentObj.isPrimary) {
			const updateDetails = await this.db.runQuery(
				`UPDATE userPaymentMethod 
					SET isPrimary=0 
					WHERE userId=(
						SELECT userId 
						FROM userPaymentMethod 
						WHERE id=?);
					UPDATE userPaymentMethod 
					SET isPrimary=1
					${metaDataQuery}
					WHERE id=?;`,
				[userPaymentMethodId, userPaymentMethodId]
			);
			if (!updateDetails[1].affectedRows) throw new RsError('UNKNOWN_ERROR', 'Failed to update payment details');
		} else {
			const updateDetails = await this.db.runQuery(
				`UPDATE userPaymentMethod 
					SET isPrimary=0
					${metaDataQuery} 
					WHERE id=?;`,
				[userPaymentMethodId]
			);
			if (!updateDetails.affectedRows) throw new RsError('UNKNOWN_ERROR', 'Failed to update payment details');
		}
		return this.getById(userPaymentMethodId);
	}

	getByProperties({ userId, ...properties }: Properties): Promise<Model.UserPaymentMethod[]> {
		const serializedPropertiesString: string = this.serializeProperties(properties);
		return this.db.runQuery(
			`SELECT * FROM userPaymentMethod where isDeleted=0 AND userId=? AND ${
				serializedPropertiesString || 'TRUE'
			};`,
			[userId]
		);
	}

	getByToken(paymentToken: string): Promise<Model.UserPaymentMethod> {
		return this.db.queryOne('SELECT * FROM userPaymentMethod WHERE isDeleted=0 AND token=?;', [paymentToken]);
	}

	protected async updateInternal(
		paymentMethodId: number,
		updateDetails: Partial<Model.UserPaymentMethod>
	): Promise<Model.UserPaymentMethod> {
		const updateResponse = await this.db.runQuery('UPDATE userPaymentMethod SET ? WHERE id=?;', [
			updateDetails,
			paymentMethodId
		]);
		if (updateResponse.affectedRows > 0) return this.getById(paymentMethodId);
		logger.error(
			`FAILED to update a user payment method internally - ${{
				paymentMethodId,
				updateDetails: JSON.stringify(updateDetails)
			}}`
		);
		throw new RsError('BAD_REQUEST', 'FAILED to update user payment method internal');
	}

	private serializeProperties(properties: Omit<Properties, 'userId'>) {
		let serializedValues = [];
		for (let index in properties) {
			serializedValues.push(mysql.format(`??=?`, [index, properties[index]]));
		}
		return serializedValues.join(' AND ');
	}
}

export const userPaymentMethod = (dbArgs) => {
	dbArgs.tableName = 'userPaymentMethod';
	return new UserPaymentMethod(dbArgs);
};
