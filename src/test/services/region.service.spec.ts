import chai, { expect } from 'chai';
import RegionService from '../../services/region/region.service';
import regionResource from '../resources/region.service.resource';

describe('Region Service', function () {
	let regionService: RegionService;
	before(() => {
		regionService = new RegionService(regionResource.regionTable);
	});

	describe('Get All Regions', async function () {
		const regions = await regionService.get();
		expect(regions).to.exist;
		expect(regions).to.be.an('array');
		expect(regions[0]).to.haveOwnProperty('id');
		expect(regions[0]).to.haveOwnProperty('name');
	});

	describe('Add Region', async function () {
		const region = await regionService.create(regionResource.regionToAdd);
		const regions = await regionService.get();
		const regionNames = regions.map((region) => region.name);
		expect(region).to.exist;
		expect(region.name).to.equal(regionResource.regionToAdd.name);
		expect(regionNames).to.include(regionResource.regionToAdd.name);
	});
});
