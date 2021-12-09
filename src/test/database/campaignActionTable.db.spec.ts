import chai from 'chai';
import dbSingleton from '../../database/dbSingleton';
import ICampaignActionTable from '../../database/interfaces/ICampaignActionTable';
import resource from '../resources/campaignAction.db.resource';
const expect = chai.expect;

describe('CampaignAction table', function () {
	let table: ICampaignActionTable;

	before(() => {
		table = dbSingleton.get().campaignAction;
	});

	describe('GetActiveByIds', function () {
		// This test needs to be rewritten so that it's not so easily broken
		it.skip('should get the campaign actions that are currently active', async () => {
			const result = await table.getActiveByIds(resource.campaignActionIds);
			expect(result, 'You fail').to.exist;
			expect(result.length, 'wrong number of items returned').equals(1);
			expect(result[0], 'wrong number of items returned')
				.to.be.a('object')
				.with.ownProperty('id')
				.equals(resource.expectedReturnId);
		});
	});
});
