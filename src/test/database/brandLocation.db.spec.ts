import chai from 'chai';
import dbSingleton from '../../database/dbSingleton';
import brandLocationResource from '../resources/brandLocation.db.resource';
import BrandLocation from '../../database/objects/brandLocation.db';
const expect = chai.expect;

describe('Brand Location view', function () {
	let table: BrandLocation;
	const resource = brandLocationResource;
	before(() => {
		table = dbSingleton.get().brandLocation;
	});
	describe('Get details', function () {
		let brandLocation: Api.Brand.Res.Location.Details;

		it('should get the brandLocation', async function () {
			const result = await table.getDetails(resource.brandLocationId);
			expect(result).to.exist;
			expect(result.id).to.equal(resource.brandLocationId);
			expect(result.address1).to.be.a('string').that.is.not.empty;
			brandLocation = result;
		});
		it('should have additional details', function () {
			expect(brandLocation).to.exist;
		});
	});
	describe('Get By Page', function () {
		it('should get brand locations and paginate', async function () {
			const result = await table.getByPage(resource.pagination, resource.sort, resource.filter);
			expect(result).to.exist;
			expect(result).to.haveOwnProperty('data');
			expect(result).to.haveOwnProperty('total');
			expect(result.data).to.be.an('array');
			expect(result.total).to.be.greaterThan(0);
		});
	});
	describe('Get Locations by Brand', function () {
		it('should get brand locations for brand', async function () {
			const result = await table.getLocationsForBrand(resource.brandId);
			expect(result).to.exist;
			expect(result).to.be.an('array');
			expect(result[0].brandId).to.equal(resource.brandId);
		});
	});
});
