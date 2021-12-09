import chai from 'chai';
import IUserPointAllocationRecordTable, {
	UserPointBreakdown
} from '../../database/interfaces/IUserPointAllocationRecordTable';
import dbSingleton from '../../database/dbSingleton';
import userPointAllocationRecordDbResource from '../resources/userPointAllocationRecord.db.resource';

describe('User Point Allocation Record Table', function () {
	let userPointAllocationRecordTable: IUserPointAllocationRecordTable;

	before(() => {
		userPointAllocationRecordTable = dbSingleton.get().userPointAllocationRecord;
	});

	describe('Get a user available point breakdown', function () {
		it('should get a users list of available points and the point allocation of those points', async function () {
			const userPointsWithAvailability: UserPointBreakdown[] = await userPointAllocationRecordTable.getAvailablePointBreakdownByUserId(
				userPointAllocationRecordDbResource.userId
			);
			chai.expect(userPointsWithAvailability).to.exist.and.be.an('array');
			chai.expect(userPointsWithAvailability.length).to.be.greaterThan(0);
			for (let userPoint of userPointsWithAvailability) {
				chai.expect(userPoint).to.haveOwnProperty('id').and.be.a('number');
				chai.expect(userPoint).to.haveOwnProperty('status').and.be.a('string');
				chai.expect(userPoint).to.haveOwnProperty('pointAmount').and.be.a('number');
				chai.expect(userPoint).to.haveOwnProperty('spentAmount').and.be.a('number');
				chai.expect(userPoint).to.haveOwnProperty('availablePoints').and.be.a('number');
				chai.expect(userPoint).to.haveOwnProperty('reason').and.be.a('string');
				chai.expect(userPoint).to.haveOwnProperty('availableOn');
				chai.expect(userPoint).to.haveOwnProperty('expireOn');
				chai.expect(userPoint.availablePoints + userPoint.spentAmount).to.equal(userPoint.pointAmount);
				chai.expect(userPoint.pointAmount - userPoint.spentAmount).to.equal(userPoint.availablePoints);
			}
		});
		it('should get a list of a users points that have availability above 100 available points', async function () {
			const userPointsWithAvailability: UserPointBreakdown[] = await userPointAllocationRecordTable.getAvailablePointBreakdownByUserId(
				userPointAllocationRecordDbResource.userId,
				userPointAllocationRecordDbResource.availablePointLimit
			);
			for (let userPoint of userPointsWithAvailability) {
				chai.expect(userPoint.availablePoints).to.be.greaterThan(
					userPointAllocationRecordDbResource.availablePointLimit
				);
			}
		});
	});
});
