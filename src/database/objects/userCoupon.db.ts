import Table from '../Table';

export default class UserCoupon extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}
}

export const userCoupon = (dbArgs) => {
	dbArgs.tableName = 'userCoupon';
	return new UserCoupon(dbArgs);
};
