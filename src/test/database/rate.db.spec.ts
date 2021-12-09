import chai from 'chai';
import IRateTable from '../../database/interfaces/IRateTable';
import rateResource from '../resources/rate.db.resource';
import dbSingleton from '../../database/dbSingleton';
const expect = chai.expect;

describe('Rate table', function () {
	let table: IRateTable;
	let createdRate: Model.Rate;

	before(async () => {
		table = dbSingleton.get().rate;
		createdRate = await table.create({
			name: 'TEST',
			description: 'TEST',
			code: Date.now().toString(),
			destinationId: rateResource.destinationId
		});
	});

	it('should get rates by destination', async function () {
		const result: Model.Rate[] = await table.getByDestinationId(rateResource.destinationId);
		expect(result).to.be.an('array').with.lengthOf.at.least(1);
		result.forEach((rate) => {
			expect(rate.destinationId).to.equal(rateResource.destinationId);
			expect(rate.code).to.be.a('string').with.lengthOf.at.least(1);
		});
	});

	after(async () => {
		const result = await dbSingleton.get().rate.deleteForTestOnly(createdRate.id);
		expect(result).to.equal(createdRate.id);
	});
});
