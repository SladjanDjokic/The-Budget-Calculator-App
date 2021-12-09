import chai from 'chai';
import CompanyService from '../../services/company/company.service';
import companyResource from '../resources/company.service.resource';
import RedisClientMock from '../../integrations/redis/redisClientMock';

describe('Company Service', () => {
	const companyService = new CompanyService(
		companyResource.companyTable,
		companyResource.companyVariablesTable,
		new RedisClientMock()
	);
	const companyId = 2;

	describe('Get a company', function () {
		it('should get a company', async function () {
			const companyDetails: Api.Company.Res.Get = await companyService.getById(companyId);
			chai.expect(companyDetails).to.exist;
			chai.expect(companyDetails).to.haveOwnProperty('name');
			chai.expect(companyDetails).to.haveOwnProperty('vanityUrls');
		});

		it('should get a paginated list of companies', async function () {
			const pageQuery: RedSky.PageQuery = {
				pagination: { page: 1, perPage: 2 }
			};
			const companyList: RedSky.RsPagedResponseData<Api.Company.Res.Get[]> = await companyService.getByPage(
				pageQuery
			);
			chai.expect(companyList).to.exist;
			chai.expect(companyList.total).to.equal(2);
			chai.expect(companyList).to.haveOwnProperty('data');
		});
	});
});
