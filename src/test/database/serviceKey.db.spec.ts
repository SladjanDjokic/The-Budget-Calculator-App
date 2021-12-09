import chai, { expect } from 'chai';
import ServiceKey from '../../database/objects/serviceKey.db';
import dbSingleton from '../../database/dbSingleton';
import resource from '../resources/serviceKey.db.resource';

describe('Service Key table', function () {
	let table: ServiceKey;
	before(() => {
		table = dbSingleton.get().serviceKey;
	});

	it('should get a single key', async function () {
		const result = await table.getServiceKeyAndCompanyDetails(resource.serviceType, resource.companyId);
		expect(result, 'No result').to.exist;
		expect(result.name).to.be.a('string');
		expect(result.serviceType).to.equal(resource.serviceType);
	});
	it('should get keys', async function () {
		const result = await table.getServiceKeysAndCompanyDetails(resource.serviceType, resource.companyId);
		expect(result, 'No result').to.exist;
		expect(result.name).to.be.a('string');
		expect(result.services).to.be.an('array').with.lengthOf.at.least(1);
		const service = result.services[0];
		expect(service.serviceType).to.equal(resource.serviceType);
		expect(service.serviceName).to.be.a('string').with.lengthOf.at.least(1);
	});
});
