import chai from 'chai';
import { ISabre } from '../../../integrations/sabre/Sabre.interface';
import sabreResource from '../../resources/sabre.integration.resource';
import dbSingleton from '../../../database/dbSingleton';
import { ServiceKeyAndDetails } from '../../../database/interfaces/IServiceKeyTable';
import SabreDestinationSystem from '../../../integrations/destinationSystem/sabre/sabre.destinationSystem';

describe('Sabre Accommodation Integration', function () {
	let companyDetails: ServiceKeyAndDetails;
	let sabreSystem: SabreDestinationSystem;
	before(async function () {
		companyDetails = await dbSingleton
			.get()
			.serviceKey.getServiceKeyAndCompanyDetails('RESERVATION', sabreResource.companyId);
		sabreSystem = new SabreDestinationSystem(
			dbSingleton.get().accommodation,
			dbSingleton.get().accommodationType,
			dbSingleton.get().destination,
			dbSingleton.get().destinationPolicy,
			dbSingleton.get().destinationTax
		);
	});

	describe('Sabre Accommodation Type', function () {
		it('should get accommodation types from sabre', async function () {
			const accommodationTypes: ISabre.AccommodationType.Res.ForHotel = await sabreSystem.getAccommodationTypes(
				companyDetails,
				sabreResource.hotelId.toString()
			);
			chai.expect(accommodationTypes).to.exist;
			chai.expect(accommodationTypes).to.haveOwnProperty;
			chai.expect(accommodationTypes.roomTypes).to.be.an('array');
			chai.expect(accommodationTypes.roomTypes.length).to.be.greaterThan(0);
		});
		it('should fail to get accommodation types from sabre', async function () {
			try {
				await sabreSystem.getAccommodationTypes(companyDetails, sabreResource.invalidHotelId);
			} catch (e) {
				chai.expect(e).to.exist;
				chai.expect(e.msg.ErrorCode).to.exist;
				chai.expect(e.msg.ErrorCode).to.equal('InvalidHotel');
			}
		});
	});
});
