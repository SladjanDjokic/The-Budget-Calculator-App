import Table from '../Table';

export default class UserSocialMedia extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}
}

export const userSocialMedia = (dbArgs) => {
	dbArgs.tableName = 'userSocialMedia';
	return new UserSocialMedia(dbArgs);
};
