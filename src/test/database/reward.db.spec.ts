import chai from 'chai';
import Reward from '../../database/objects/reward.db';
import dbSingleton from '../../database/dbSingleton';
import rewardTableResource from '../resources/reward.db.resource';
const expect = chai.expect;

describe('Reward table', function () {
	let table: Reward;

	before(() => {
		table = dbSingleton.get().reward;
	});

	describe('Reward details', function () {
		let rewards: Api.Reward.Res.GetByPage;
		before(async () => {
			rewards = await table.getByPage(
				rewardTableResource.pagination,
				rewardTableResource.sort,
				rewardTableResource.filter
			);
		});
		it('should get a list of rewards', async function () {
			expect(rewards).to.exist;
			expect(rewards.data).to.be.a('array').with.length.greaterThan(0);
		});
		it('should return the correct total of rewards', async function () {
			expect(rewards.data.length).to.be.lessThanOrEqual(rewardTableResource.pagination.perPage);
		});
		it('should have row categories', function () {
			let reward = rewards.data[0];
			expect(reward.media).to.exist;
			expect(reward.vendorName).to.be.a('string');
			expect(reward.categoryIds).to.exist;
		});
	});

	describe('Customer filters', function () {
		it('should get rewards in a category', async function () {
			const result = await table.customerGetByPage(
				rewardTableResource.pagination,
				[],
				[],
				rewardTableResource.categories,
				null,
				null
			);
			expect(result.data).to.be.an('array').with.lengthOf.at.least(1);
		});
	});
});
