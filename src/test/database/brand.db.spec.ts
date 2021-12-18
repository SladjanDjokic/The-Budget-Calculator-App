import chai from 'chai';
import dbSingleton from '../../database/dbSingleton';
import resource from '../resources/brandTable.db.resource';
import IBrandTable from '../../database/interfaces/IBrandTable';

const expect = chai.expect;

describe('Brand table', function () {
	let table: IBrandTable;
	before(() => {
		table = dbSingleton.get().brand;
	});

	describe('reports', function () {
		let report: Api.Brand.Res.Report;
		it('should get reports for brands in a specific company', async function () {
			const results = await table.getReportsByPage(
				resource.pagination,
				resource.sort,
				undefined,
				resource.companyId
			);
			expect(results).to.exist;
			expect(results).to.haveOwnProperty('total').that.is.greaterThan(0);
			expect(results).to.haveOwnProperty('data').that.is.an('array');
			report = results.data[0];
		});
		it('should have the correct properties', function () {
			expect(report).to.haveOwnProperty('spireYTDRevenue');
			expect(report).to.haveOwnProperty('pointsPerDollar');
			expect(report).to.haveOwnProperty('costPerPoint');
			expect(report).to.haveOwnProperty('costToMerchant');
			expect(report).to.haveOwnProperty('spireRevenuePerDollar');
			expect(report).to.haveOwnProperty('spireRevenuePerPoint');
			expect(report).to.haveOwnProperty('loyaltyStatus');
		});
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
			expect(result.data).to.be.an('array').with.lengthOf.at.least(1);
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
