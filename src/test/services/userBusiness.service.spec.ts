import chai from 'chai';
import userBusinessResource from '../resources/userBusiness.service.resource';
import UserBusinessService from '../../services/userBusiness/userBusiness.service';

describe('userBusinessService', function () {
	let userBusiness: Model.UserBusiness[];
	const userBusinessService = new UserBusinessService(userBusinessResource.userBusinessTable);

	describe('create userBusiness', function () {
		it('should create an entry in userBusiness', async function () {
			const createdUserBusiness: Model.UserBusiness = await userBusinessService.create(
				userBusinessResource.userBusinessCreate
			);
			chai.expect(createdUserBusiness).to.exist;
			chai.expect(createdUserBusiness).to.haveOwnProperty;
			userBusiness = [createdUserBusiness];
		});
	});

	describe('get a user business by a userId', function () {
		it('should get a user business object by user id', async function () {
			const localUserBusiness: Model.UserBusiness[] = await userBusinessService.getByUserId(
				userBusiness[0].userId
			);
			chai.expect(localUserBusiness).to.exist;
		});
	});
});
