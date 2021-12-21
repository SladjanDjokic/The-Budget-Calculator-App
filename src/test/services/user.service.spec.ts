// Mock the agenda integration so we don't get email jobs created
import { ImportMock } from 'ts-mock-imports';
import * as agendaJsMocks from '../../integrations/agenda/agendaJs';
import AgendaMock from '../../integrations/agenda/AgendaMock';

let agendaMock = new AgendaMock();
// @ts-ignore
const mockManager = ImportMock.mockOther(agendaJsMocks, 'default', agendaMock);

import UserService from '../../services/user/user.service';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import UserResource from '../resources/user.service.resource';
import CompanyServiceMock from '../../services/company/company.service.mock';
import EmailServiceMock from '../../services/email/email.service.mock';
import RedisClientMock from '../../integrations/redis/redisClientMock';
import bcrypt from '../../utils/bcrypt';
import dbSingleton from '../../database/dbSingleton';
import redisClient from '../../integrations/redis/client';
import { DateUtils } from '../../utils/utils';
import { UserAuthenticate } from '../../database/interfaces/IUserTable';
import { RsError } from '../../utils/errors';
import UserActionTableMock from '../../database/mocks/userAction.db.mock';
chai.use(chaiAsPromised);

describe('UserService', function () {
	let userResource: UserResource;
	let userService: UserService;

	function initialize() {
		userResource = new UserResource();
		userService = new UserService(
			userResource.userTable,
			userResource.userAddressTable,
			userResource.userPermissionTable,
			userResource.userCompletedCampaignTable,
			new RedisClientMock(),
			new UserActionTableMock()
		);
		userService.start({
			TierService: userResource.tierService,
			EmailService: new EmailServiceMock(),
			CompanyService: new CompanyServiceMock(userResource.companyVariables)
		});
	}

	describe('Create a user', function () {
		beforeEach(initialize);
		it('should create a new user in the db', async function () {
			let user: Api.User.Filtered = await userService.create(
				userResource.userCreate,
				userResource.hostname,
				userResource.companyId
			);

			chai.expect(user.id).to.equal(userResource.userTable.lastId);
			chai.expect(userResource.userPermissionTable.createCalls, 'never created permission').to.be.greaterThan(0);
			const newPermission = userResource.userPermissionTable.permissions[0];
			chai.expect(newPermission).to.exist;
			chai.expect(newPermission.key).to.exist;
			chai.expect(newPermission.userId).to.equal(user.id);
			chai.expect(user.permissionLogin).not.to.exist;
			chai.expect((user as any).password).not.to.exist;
		});

		it('should fail to create a user with an invalid email', async function () {
			userResource.userCreate.primaryEmail = '@gmail.com' + Date.now() + '@gmail.com';
			try {
				await userService.create(userResource.userCreate, userResource.hostname, userResource.companyId);
			} catch (e) {
				chai.expect(e.err).to.equal('BAD_REQUEST');
			}
		});

		it('should create a new customer', async function () {
			const customer: Api.User.Filtered = await userService.create(
				userResource.createCustomer,
				userResource.hostname,
				userResource.companyId
			);
			chai.expect(customer).to.exist;
			chai.expect(customer.id, 'customer id did not match').to.equal(userResource.userTable.lastId);
			chai.expect(customer.primaryEmail, 'customer email did not match').to.equal(
				userResource.createCustomer.primaryEmail
			);
		});

		it('should save customer settings', async function () {
			const customer: Api.User.Filtered = await userService.create(
				userResource.createCustomer,
				userResource.hostname,
				userResource.companyId
			);
			chai.expect(userResource.existingUser.allowEmailNotification).to.equal(
				userResource.createCustomer.emailNotification
			);
		});
	});

	describe('Update a user object', function () {
		beforeEach(initialize);
		it('should update an existing user', async function () {
			let user: Api.User.Filtered = await userService.update(
				userResource.existingUser.id,
				userResource.userUpdate
			);
			chai.expect(user.id).to.exist;
			chai.expect(user.firstName).to.equal(userResource.userUpdate.firstName);
			chai.expect(user.lastName).to.equal(userResource.userUpdate.lastName);
		});
		it('should update the user role', async function () {
			let user: Api.User.Filtered = await userService.update(
				userResource.existingUser.id,
				userResource.userRoleUpdate
			);
			chai.expect(user.id).to.exist;
			chai.expect(user.userRoleId).to.equal(userResource.userRoleUpdate.userRoleId);
			chai.expect(userResource.userPermissionTable.createCalls).to.be.greaterThan(0);
		});
		it('should update user tier add points to a user', async function () {
			userResource.existingUser.availablePoints = 0;
			userResource.existingUser.lifeTimePoints = 0;
			const user: Api.User.Filtered = await userService.updatePoints(
				userResource.existingUser.id,
				userResource.pointValue,
				userResource.pointStatusReceived
			);
			chai.expect(user.id).to.exist;
			chai.expect(user.tierId).to.exist;
			chai.expect(user.lifeTimePoints).to.equal(userResource.pointValue);
			chai.expect(user.availablePoints).to.equal(userResource.pointValue);
		});
		it('should update user tier and remove points from a user', async function () {
			userResource.existingUser.availablePoints = userResource.pointValue;
			const user: Api.User.Filtered = await userService.updatePoints(
				userResource.existingUser.id,
				-userResource.pointValue,
				userResource.pointStatusRevoked
			);
			chai.expect(user.id).to.exist;
			chai.expect(user.tierId).to.exist;
			chai.expect(user.lifeTimePoints).to.equal(userResource.existingUser.lifeTimePoints);
			chai.expect(user.availablePoints).to.equal(0);
		});
		it('should update a password', async () => {
			const newPassword = 'TESTPASSWORD';
			const success: boolean = await userService.updatePassword(
				userResource.existingUser.id,
				userResource.login.password,
				newPassword,
				userResource.companyId
			);
			chai.expect(success);
			chai.expect(bcrypt.compare(newPassword, userResource.existingUser.password));
		});
		it('should not update a password with an invalid old password', async () => {
			const promisedUpdate = userService.updatePassword(
				userResource.existingUser.id,
				userResource.login.password + 'WRONG',
				'newPassword',
				userResource.companyId
			);
			await chai
				.expect(promisedUpdate)
				.to.eventually.be.rejected.with.an.instanceOf(RsError)
				.with.property('err', 'INCORRECT_EMAIL_OR_PASSWORD');
		});
		it('should not update a password with a regular update request', async () => {
			const originalPassword = userResource.existingUser.password;
			await userService
				.update(userResource.existingUser.id, {
					password: userResource.existingUser.password + 'CHANGED'
				} as any)
				.then(() => chai.expect(userResource.existingUser.password).to.eql(originalPassword));
		});
		it('should update customer settings', async function () {
			let user: Api.User.Filtered = await userService.update(userResource.existingUser.id, {
				allowEmailNotification: Math.abs(userResource.createCustomer.emailNotification - 1)
			} as any);
			chai.expect(user.allowEmailNotification).not.to.equal(userResource.createCustomer.emailNotification);
		});
	});

	describe('Get user/users', function () {
		beforeEach(initialize);
		it('should get a user object by the users id', async function () {
			let user: Api.User.Filtered = await userService.getById(userResource.existingUser.id);
			chai.expect(user.primaryEmail).to.equal(userResource.existingUser.primaryEmail);
			chai.expect(user).to.haveOwnProperty('permission');
			chai.expect(user).to.haveOwnProperty('address');
		});
		it('should get users by page', async function () {
			userService = new UserService(
				dbSingleton.get().user,
				dbSingleton.get().userAddress,
				dbSingleton.get().userPermission,
				dbSingleton.get().userCompletedCampaign,
				redisClient,
				dbSingleton.get().userAction
			);
			userService.start({
				TierService: userResource.tierService,
				CompanyService: new CompanyServiceMock(userResource.companyVariables),
				EmailService: new EmailServiceMock()
			});
			const user: RedSky.RsPagedResponseData<Api.User.Filtered> = await userService.getByPage(
				userResource.userByPage.pagination,
				userResource.userByPage.sort,
				userResource.userByPage.filter
			);
			chai.expect(user.data).to.exist;
			chai.expect(user.total).to.exist;
			chai.expect(user.data).to.be.an('array');
			chai.expect(user.total).to.be.greaterThan(1);
			chai.expect(user.data[0]).to.haveOwnProperty('id');
			chai.expect(user.data[0]).to.haveOwnProperty('address');
			chai.expect(user.data[0]).to.haveOwnProperty('permission');
		});
		it('should get customer details', async () => {
			userResource.existingUser.userRoleId = userResource.customerRole.id;
			const customer: Api.User.Res.Detail = await userService.getUserDetails(userResource.existingUser.id);
			chai.expect(customer).to.exist;
			chai.expect(customer.id).to.equal(userResource.existingUser.id);
			chai.expect(customer).to.haveOwnProperty('tierTitle');
			chai.expect(customer).to.haveOwnProperty('tierBadge');
			chai.expect(customer.tierBadge).to.haveOwnProperty('urls');
			chai.expect(customer.tierBadge).not.to.haveOwnProperty('storageDetails');
		});
	});

	describe('Login a user', function () {
		beforeEach(initialize);
		it('should login the user and return a formatted user object', async function () {
			let authUser = await userService.login(userResource.existingUser.primaryEmail, userResource.login.password);
			chai.expect(authUser.id).to.equal(userResource.existingUser.id);
		});
		it('should fail to login an admin user with an expired login', async function () {
			userResource.existingUser.loginExpiresOn = DateUtils.hoursFromNow(-48);
			try {
				await userService.loginAdminPortal(
					userResource.existingUser.primaryEmail,
					userResource.login.password,
					userResource.hostname
				);
				chai.assert(false, 'did not throw an error as expected');
			} catch (e) {
				chai.expect(e).to.have.property('err', 'LOGIN_EXPIRED', 'threw wrong error type');
			}
		});
		it('should authenticate a user by token', async function () {
			const userAuth: UserAuthenticate = await userService.auth(
				userResource.existingUser.primaryEmail,
				userResource.login.password
			);
			const authenticatedUser: Api.User.Filtered = await userService.authToken(userAuth.token);
			chai.expect(authenticatedUser).to.exist;
			chai.expect(authenticatedUser.id).to.equal(userResource.existingUser.id);
		});
		it('should fail to authenticate a user by token with an expired login', async function () {
			try {
				userResource.existingUser.loginExpiresOn = DateUtils.hoursFromNow(-48);
				const userAuth: UserAuthenticate = await userService.auth(
					userResource.existingUser.primaryEmail,
					userResource.login.password
				);
				const authenticatedUser: Api.User.Filtered = await userService.authToken(userAuth.token, true);
				chai.assert(false, 'auth succeeded when it should have failed');
			} catch (e) {
				chai.expect(e).to.have.property('err', 'LOGIN_EXPIRED', 'threw wrong error type');
			}
		});
		it('should verify a user to login', async function () {
			const user: Model.User = await userService.getUserOnlyById(userResource.existingUser.id);
			const verifiedUser: Api.User.Filtered = await userService.verifyLogin(user.loginVerificationGuid);
			chai.expect(verifiedUser).to.exist;
			chai.expect(verifiedUser.id).to.equal(user.id);
			chai.expect(verifiedUser.loginExpiresOn).to.not.be.null;
			chai.expect(new Date(verifiedUser.loginExpiresOn).getTime()).to.be.greaterThan(new Date().getTime());
		});
		it('should fail to verify user login with expired guid', async function () {
			userResource.existingUser.loginVerificationExpiresOn = DateUtils.addDays(new Date(), -1);
			const user: Model.User = await userService.getUserOnlyById(userResource.existingUser.id);
			try {
				await userService.verifyLogin(user.loginVerificationGuid);
			} catch (e) {
				chai.expect(e.err).to.equal('NOT_FOUND');
			}
		});
		it('should login after being verified', async function () {
			const authenticatedUser: Api.User.Filtered = await userService.loginAdminPortal(
				userResource.existingUser.primaryEmail,
				userResource.login.password,
				userResource.hostname
			);
			chai.expect(authenticatedUser).to.exist;
			chai.expect(authenticatedUser.id).to.equal(userResource.existingUser.id);
			chai.expect(new Date(authenticatedUser.loginExpiresOn).getTime()).to.be.greaterThan(new Date().getTime());
		});
		it('should authenticate a user by token after verification', async function () {
			const verifiedUser: Api.User.Filtered = await userService.verifyLogin(
				userResource.existingUser.loginVerificationGuid
			);
			const authenticatedUser: Api.User.Filtered = await userService.authToken(verifiedUser.token, true);
			chai.expect(authenticatedUser).to.exist;
			chai.expect(authenticatedUser.id).to.equal(userResource.existingUser.id);
		});
	});

	describe('User Roles', function () {
		it('should get the user roles', async function () {
			const companyRoles = await userService.getRoles();
			chai.expect(companyRoles).to.exist;
			chai.expect(companyRoles[0]).to.haveOwnProperty('id');
			chai.expect(companyRoles[0]).to.haveOwnProperty('name');
		});
	});

	describe('User helper methods', function () {
		it('should not throw an error when trying to see if a user is valid to create', async function () {
			let newCustomerToValidate = {
				...userResource.createCustomer
			};
			newCustomerToValidate.primaryEmail = `${Date.now()}_new_customer_to_validate@redskytech.io`;
			const result = await userService['isValidToCreate'](newCustomerToValidate);
			chai.expect(result).to.equal(undefined);
		});
		it('should throw an error due to an invalid email', async function () {
			let newCustomerToValidate = {
				...userResource.createCustomer
			};
			newCustomerToValidate.primaryEmail = `${Date.now()}_new_customer_to_validate`;
			try {
				await userService['isValidToCreate'](newCustomerToValidate);
			} catch (e) {
				chai.expect(e.err).to.equal('BAD_REQUEST');
			}
		});
		it('should throw an error due to duplicate email', async function () {
			try {
				await userService['isValidToCreate'](userResource.createCustomer);
			} catch (e) {
				chai.expect(e.err).to.equal('DUPLICATE_EMAIL');
			}
		});
	});
	describe('Create or get a guest account', () => {
		it('should get an existing account from the email', async () => {
			const user = await userService.getUserForEmail(userResource.existingUser.primaryEmail);
			chai.expect(user, 'unable to get from email').to.exist;
		});
		it('should create a not signed up for spire account', async () => {
			const createdUser = await userService.getOrCreate(userResource.guestUserNoEnroll, '');
			chai.expect(createdUser, 'guest account not created').to.exist;
			chai.expect(createdUser, 'not a guest account').to.haveOwnProperty('permissionLogin').that.equals(0);
		});
		it('should create an account and sign up for spire', async () => {
			const createdUser = await userService.getOrCreate(userResource.guestUserEnroll, '');
			chai.expect(createdUser, 'guest account not created').to.exist;
			chai.expect(createdUser, 'not a guest account').to.haveOwnProperty('permissionLogin').that.equals(1);
		});
	});
});
