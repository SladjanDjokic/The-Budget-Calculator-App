import { expect } from 'chai';
import Region from '../../database/objects/region.db';
import dbSingleton from '../../database/dbSingleton';
import regionTableResource from '../resources/region.db.resource';

describe('Region table', function () {
	let table: Region;
	let createdRegion: Model.Region;

	before(() => {
		table = dbSingleton.get().region;
	});

	describe('Region details', function () {
		let regions: Api.Region.Res.Get[];
		before(async () => {
			regions = await table.get();
		});

		it('should get a list of regions', function () {
			expect(regions).to.exist;
			expect(regions).to.be.a('array').with.length.greaterThan(0);
		});
		it('should have the correct columns', function () {
			let region = regions[0];
			expect(region).to.haveOwnProperty('id');
			expect(region).to.haveOwnProperty('name');
		});
	});
	describe('Add region', function () {
		it('should add the region to the table', async function () {
			const result = await table.create({ name: regionTableResource.regionToAdd });
			expect(result.name).to.equal(regionTableResource.regionToAdd);
			createdRegion = result;
		});
	});
	describe('Edit region', async function () {
		it('should update a region', async function () {
			const result = await table.update(createdRegion.id, { name: regionTableResource.regionToUpdate });
			expect(result.id).to.equal(createdRegion.id);
			expect(result.name).to.equal(regionTableResource.regionToUpdate);
			createdRegion = result;
		});
	});
	after(async function () {
		await table.deleteForTestOnly(createdRegion.id);
	});
});
