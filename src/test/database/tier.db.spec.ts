import dbSingleton from '../../database/dbSingleton';
import ITierTable from '../../database/interfaces/ITierTable';
import { expect } from 'chai';
import resource from '../resources/tier.db.resource';

describe('Tier Table', function () {
	let table: ITierTable;
	before(() => {
		table = dbSingleton.get().tier;
	});
	describe('Create', function () {
		let createdTier: Model.Tier;
		before(async function () {
			createdTier = await table.create(resource.tierToCreate);
			expect(createdTier).to.exist;
		});
		it('should have a name', function () {
			expect(createdTier).to.haveOwnProperty('name').that.equals(resource.tierToCreate.name);
		});
		after(async function () {
			await dbSingleton.get().tier.deleteForTestOnly(createdTier.id);
		});
	});
});
