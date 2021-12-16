import chai from 'chai';
import dbSingleton from '../../database/dbSingleton';
import IBrandTable from '../../database/interfaces/IBrandTable';
import brandTableResource from '../resources/brand.db.resource';
const expect = chai.expect;

describe('Brand view', function () {
	let table: IBrandTable;
	const resource = brandTableResource;
	before(() => {
		table = dbSingleton.get().brand;
	});
	describe('Get details', function () {
		let brand: Api.Brand.Res.Details;

		it('should get the brand', async function () {
			const result = await table.getDetails(resource.brandId);
			expect(result).to.exist;
			expect(result.id).to.equal(resource.brandId);
			expect(result.name).to.be.a('string').that.is.not.empty;
			brand = result;
		});
		it('should have additional details', function () {
			expect(brand).to.haveOwnProperty('companyName');
			expect(brand.companyName).to.be.a('string').that.is.not.empty;
		});
		it('should have an array of locations', function () {
			expect(brand).to.haveOwnProperty('locations');
			expect(brand.locations).to.be.an('array');
		});
	});
	describe('Get By Page', function () {
		let brand: Api.Brand.Res.Details;
		it('should get brands and paginate', async function () {
			const result = await table.getByPage(resource.pagination, resource.sort, resource.filter);
			expect(result).to.exist;
			expect(result).to.haveOwnProperty('data');
			expect(result).to.haveOwnProperty('total');
			expect(result.data).to.be.an('array');
			expect(result.data[0]).to.haveOwnProperty('companyName').that.is.a('string').that.is.not.empty;
			expect(result.total).to.be.greaterThan(0);
			brand = result.data[0];
		});
		it('should get an array of locations for each brand', function () {
			expect(brand).to.haveOwnProperty('locations');
			expect(brand.locations).to.be.an('array');
		});
	});
});
