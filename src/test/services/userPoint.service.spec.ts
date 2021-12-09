import UserPointService from '../../services/userPoint/userPoint.service';
import chai from 'chai';
import dbSingleton from '../../database/dbSingleton';
import { WebUtils } from '../../utils/utils';
import serviceFactory from '../../services/serviceFactory';
import userPointResource from '../resources/userPoint.service.resource';
import UserPoint from '../../database/objects/userPoint.db';
import UserService from '../../services/user/user.service';
const expect = chai.expect;

describe('UserPointService', function () {
	let userPointService: UserPointService;
	let userService: UserService;
	let createdUserPoints: Model.UserPoint;
	let user: Api.User.Filtered;
	before(function () {
		userPointService = serviceFactory.get<UserPointService>('UserPointService');
		userService = serviceFactory.get<UserService>('UserService');
	});
	after(async function () {
		const db: UserPoint = dbSingleton.get().userPoint;
		// Clean up test data
		await WebUtils.sleep(1000);
		await db.dbUtil.db.runQuery('DELETE FROM userPoint WHERE id = ?;', [createdUserPoints.id]);
	});

	describe('Create user points', function () {
		it('should create points for a user', async function () {
			const companyUsers: RedSky.RsPagedResponseData<Model.UserPoint> = await userService.getByPage(
				userPointResource.pagination,
				userPointResource.sort,
				{ matchType: 'like', searchTerm: [{ column: 'userRoleId', value: 1 }] }
			);
			user = companyUsers.data[0];
			const createPointObj = {
				...userPointResource.userPointCreate,
				userId: user.id
			};
			let userPoints: Model.UserPoint = await userPointService.create(createPointObj);
			expect(userPoints.id).to.exist;
			expect(userPoints).to.haveOwnProperty('pointType');
			expect(userPoints).to.haveOwnProperty('pointAmount');
			expect(userPoints).to.haveOwnProperty('status');
			expect(userPoints.status).to.equal(userPointResource.userPointCreate.status);
			createdUserPoints = userPoints;
		});
	});

	describe('Get points', function () {
		it('should get a user point object by userPointId', async function () {
			let userPoint: Model.UserPoint = await userPointService.getById(createdUserPoints.id);
			expect(userPoint).to.exist;
			expect(userPoint.id).to.equal(createdUserPoints.id);
			expect(userPoint.pointAmount).to.equal(createdUserPoints.pointAmount);
			expect(userPoint.pointType).to.equal(createdUserPoints.pointType);
		});
		it('should get user points for a user', async function () {
			const usersPoints: Model.UserPoint[] = await userPointService.getByUserId(user.id);
			expect(usersPoints).to.exist;
			expect(usersPoints).to.be.an('array');
			expect(usersPoints.length).to.be.greaterThan(0);
		});
		it('should get user points by page', async function () {
			const user: RedSky.RsPagedResponseData<Model.UserPoint[]> = await userPointService.getByPage(
				userPointResource.pagination,
				userPointResource.sort,
				userPointResource.filter
			);
			expect(user.data).to.exist;
			expect(user.total).to.exist;
			expect(user.data).to.be.an('array');
			expect(user.total).to.be.greaterThan(0);
			expect(user.data[0]).to.haveOwnProperty('id');
			expect(user.data[0]).to.haveOwnProperty('pointType');
			expect(user.data[0]).to.haveOwnProperty('pointAmount');
			expect(user.data[0]).to.haveOwnProperty('status');
		});
	});

	describe('Revoke points', function () {
		it('should revoke points from a cancelled reservation', async function () {
			const result: Model.UserPoint = await userPointService.revokePendingReservationPoints(
				userPointResource.userPointCreate.reservationId
			);
			expect(result.id).to.equal(createdUserPoints.id);
			expect(result.status).to.equal('REVOKED');
		});
	});
});
