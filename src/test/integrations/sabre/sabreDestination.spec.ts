import chai from 'chai';
import sabreResource from '../../resources/sabre.integration.resource';
import SabreDestinationSystem from '../../../integrations/destinationSystem/sabre/sabre.destinationSystem';
import dbSingleton from '../../../database/dbSingleton';
import { ServiceKeyAndDetails } from '../../../database/interfaces/IServiceKeyTable';
const expect = chai.expect;

describe('Sabre Destination Integration', function () {
	let sabreSystem: SabreDestinationSystem;
	let companyDetails: ServiceKeyAndDetails;
	before(async function () {
		companyDetails = await dbSingleton
			.get()
			.serviceKey.getServiceKeyAndCompanyDetails('DESTINATION', sabreResource.companyId);
		sabreSystem = new SabreDestinationSystem(
			dbSingleton.get().accommodation,
			dbSingleton.get().accommodationType,
			dbSingleton.get().destination,
			dbSingleton.get().destinationPolicy,
			dbSingleton.get().destinationTax
		);
	});

	describe('Destination list', function () {
		it('should get destination list from Sabre', async function () {
			const response = await sabreSystem.getDestinationList(companyDetails);
			expect(response, 'Failed to get destinations')
				.to.exist.and.be.an('array')
				.with.length.greaterThan(0, 'No destinations in response');
			const destination = response.find((d) => !!d.Attributes?.length);
			expect(destination, 'No destination found with attributes').to.exist;
		});
		it('should sync destination list', async function () {
			const response = await sabreSystem.syncDestinationList(companyDetails);
			expect(response, 'Failed to get destinations').to.exist;
			expect(Object.keys(response), 'No destinations returned').to.have.length.greaterThan(0);
			const localPolicies = await dbSingleton.get().destinationPolicy.getForCompany(companyDetails.id);
			expect(localPolicies, 'Failed to get policies')
				.to.exist.and.be.an('array')
				.with.length.greaterThan(0, 'No policies in database');
		});
		it('should get destination taxes', async function () {
			const response = await sabreSystem['getTaxesForDestinations'](companyDetails, {
				[sabreResource.hotelId]: sabreResource.destinationId
			});
			expect(response, 'No response').to.exist;
			expect(response).to.be.an('array').with.length.greaterThan(0, 'Empty response');

			const tax = response[0];
			expect(tax.destinationId).to.equal(sabreResource.destinationId, 'Tax associated with wrong destination');
			expect(tax.code, 'No code').to.be.a('string').with.length.greaterThan(0);
			expect(tax.name, 'No name').to.be.a('string').with.length.greaterThan(0);
		});
		it('should save destination taxes', async function () {
			await sabreSystem['syncDestinationTaxes'](companyDetails, {
				[sabreResource.hotelId]: sabreResource.destinationId
			});

			const spireTaxes: Model.DestinationTax[] = await dbSingleton
				.get()
				.destinationTax.getForDestination(sabreResource.destinationId, sabreResource.companyId);
			expect(spireTaxes, 'Failed to get taxes')
				.to.exist.and.be.an('array')
				.with.length.greaterThan(0, 'No taxes in database');
		});
	});

	describe('Destination details', function () {
		it('should get destination with attributes from sabre', async function () {
			const response = await sabreSystem.getHotelById(companyDetails, sabreResource.hotelId);
			expect(response, 'no response');
			expect(response.hotelList).to.exist.and.be.an('array').with.length.greaterThan(0);
			const hotel = response.hotelList[0];
			expect(hotel.Attributes, 'no attributes').to.exist.and.be.an('array').with.length.greaterThan(0);
		});
	});
});
