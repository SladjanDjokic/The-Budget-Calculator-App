import chai from 'chai';
import dbSingleton from '../../database/dbSingleton';
import Company from '../../database/objects/company.db';

const expect = chai.expect;

describe('Company Table', function () {
	let table: Company;
	let companyAndClientVariables: Api.Company.Res.GetCompanyAndClientVariables;
	before(async () => {
		table = dbSingleton.get().company;
		companyAndClientVariables = await table.getCompanyAndClientVariables(0);
	});
	it('should get the company and variable information', function () {
		expect(companyAndClientVariables).to.exist;
		expect(companyAndClientVariables.name).to.equal('Spire Loyalty');
	});
	describe('Has allow point and cash bookings', function () {
		it('should have point and cash based bookings', function () {
			expect(companyAndClientVariables.allowPointBooking).to.equal(1);
			expect(companyAndClientVariables.allowCashBooking).to.equal(1);
		});
	});
});
