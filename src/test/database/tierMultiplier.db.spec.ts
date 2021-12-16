import dbSingleton from '../../database/dbSingleton';
import ITierMultiplierTable from '../../database/interfaces/ITierMultiplierTable';
import { expect } from 'chai';
import resource from '../resources/tierMultiplier.db.resource';

describe('Tier Multiplier Table', function () {
	let table: ITierMultiplierTable;
	let tier: Model.Tier;
	before(async () => {
		table = dbSingleton.get().tierMultiplier;
		tier = await dbSingleton.get().tier.db.queryOne(`SELECT * FROM tier LIMIT 1;`);
	});

	describe('Create', function () {
		let createdMultiplier: Model.TierMultiplier;
		before(async function () {
			resource.multiplierToCreate.tierId = tier.id;
			createdMultiplier = await table.create(resource.multiplierToCreate);
			expect(createdMultiplier).to.exist;
		});
		it('should match', function () {
			const source = resource.multiplierToCreate;
			expect(createdMultiplier).to.haveOwnProperty('id').that.is.greaterThan(0);
			expect(createdMultiplier).to.haveOwnProperty('multiplier').that.equals(source.multiplier);
			expect(createdMultiplier).to.haveOwnProperty('tierId').that.equals(source.tierId);
		});
		after(async function () {
			await dbSingleton.get().tierMultiplier.deleteForTestOnly(createdMultiplier.id);
		});
	});
});
