import chai from 'chai';
import User from '../../database/objects/user.db';
import dbSingleton from '../../database/dbSingleton';
import userTableResource from '../resources/userTable.db.resource';
const expect = chai.expect;

describe('User table', function () {
	let table: User;
	let user: Api.User.Res.Get;

	before(() => {
		table = dbSingleton.get().user;
	});

	describe('Create user', function () {
		it('should create a user', async function () {
			const createdUser = await table.create(userTableResource.userToCreate);
			expect(createdUser).to.exist;
			expect(createdUser).to.have.ownProperty('firstName').that.equals(userTableResource.userToCreate.firstName);
			user = createdUser;
			await table.update(user.id, { tierId: 522 });
		});
	});

	describe('User details', function () {
		it('should return the right user', async function () {
			const retrievedUser = await table.getUserDetails(user.id);
			expect(retrievedUser).to.exist;
			expect(retrievedUser.id).to.equal(user.id);
		});
		it("should return the user's tier info", async function () {
			const retrievedUser = await table.getUserDetails(user.id);
			expect(retrievedUser.tierTitle, 'No tier title').to.exist;
			expect(retrievedUser.tierTitle).to.have.length.greaterThan(0, 'Empty tier title');
			expect(retrievedUser.nextTierThreshold)
				.to.be.a('number', 'No next tier threshold')
				.greaterThan(0, 'Invalid next tier threshold');
			expect(retrievedUser.nextTierTitle)
				.to.be.a('string', 'No next tier title')
				.with.length.greaterThan(0, 'Empty next tier title');
		});
	});

	after(async () => {
		await table.deleteForTest(user.id);
	});
});
