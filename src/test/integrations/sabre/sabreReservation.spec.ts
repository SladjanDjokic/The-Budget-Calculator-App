import chai, { AssertionError, expect } from 'chai';
import { ServiceKeyAndDetails } from '../../../database/interfaces/IServiceKeyTable';
import dbSingleton from '../../../database/dbSingleton';
import AccommodationTableMock from '../../../database/mocks/accommodation.db.mock';
import DestinationTableMock from '../../../database/mocks/destination.db.mock';
import SabreReservationSystem from '../../../integrations/reservationSystem/sabre/sabre.reservationSystem';
import sabreResource from '../../resources/sabre.integration.resource';
import { DateUtils, ObjectUtils, RedisUtils } from '../../../utils/utils';
import { IRedisClient } from '../../../integrations/redis/IRedisClient';
import redisClient from '../../../integrations/redis/client';
import RedisClientMock from '../../../integrations/redis/redisClientMock';
import serviceFactory from '../../../services/serviceFactory';
import DestinationService from '../../../services/destination/destination.service';
import DestinationTaxTableMock from '../../../database/mocks/destinationTax.db.mock';
import ReservationTableMock from '../../../database/mocks/reservation.db.mock';
import UserPaymentMethodTableMock from '../../../database/mocks/userPaymentMethod.db.mock';
import UserAddressTableMock from '../../../database/mocks/userAddress.db.mock';
import { ISabre } from '../../../integrations/sabre/Sabre.interface';
import UpsellPackageTableMock from '../../../database/mocks/upsellPackage.db.mock';
import { AvailabilityCacheBlock } from '../../../services/reservation/reservation.service';
import { UpsellPackageCacheBlock } from '../../../services/packages/packages.service';
import { IReservationSystem } from '../../../integrations/reservationSystem/reservationSystem.interface';
import logger from '../../../utils/logger';
import RateTableMock from '../../../database/mocks/rate.db.mock';
import { RsError } from '../../../utils/errors';

describe('Sabre Reservation Integration', function () {
	let sabreSystem: SabreReservationSystem;
	let redis: IRedisClient;
	let companyDetails: ServiceKeyAndDetails;
	let createdReservation: IReservationSystem.CreateReservation.Res;
	let reservationWasCreated: boolean;

	function initializeMock() {
		const destinationTable = new DestinationTableMock([], new AccommodationTableMock([]));
		const accommodationTable = new AccommodationTableMock([]);
		const paymentMethodTable = new UserPaymentMethodTableMock({});
		const addressTable = new UserAddressTableMock();
		const upsellPackageTable = new UpsellPackageTableMock([]);
		redis = new RedisClientMock();
		sabreSystem = new SabreReservationSystem(
			new ReservationTableMock(
				{},
				destinationTable,
				accommodationTable,
				paymentMethodTable,
				addressTable,
				upsellPackageTable
			),
			accommodationTable,
			destinationTable,
			new DestinationTaxTableMock(),
			upsellPackageTable,
			new RateTableMock(),
			redis
		);
	}

	async function initializeLive() {
		redis = redisClient;
		sabreSystem = new SabreReservationSystem(
			dbSingleton.get().reservation,
			dbSingleton.get().accommodation,
			dbSingleton.get().destination,
			dbSingleton.get().destinationTax,
			dbSingleton.get().upsellPackage,
			dbSingleton.get().rate,
			redis
		);
		companyDetails = await dbSingleton
			.get()
			.serviceKey.getServiceKeyAndCompanyDetails('RESERVATION', sabreResource.companyId);
	}

	describe('Helper Methods', function () {
		beforeEach(initializeMock);
		it('should format a query string for given availability', async function () {
			const queryString = SabreReservationSystem['formatAvailabilityQueryString'](
				sabreResource.availabilityOptions
			);
			chai.expect(queryString).to.exist;
			chai.expect(queryString).to.be.a('string');
			chai.expect(queryString).to.include(sabreResource.availabilityOptions.secondaryChannel);
		});
		it('should format the daily price object for a given date', async function () {
			const result = SabreReservationSystem['getDailyPriceForDate'](
				sabreResource.sabrePricesObj,
				[sabreResource.rate],
				sabreResource.indexDate
			);
			expect(result).to.exist;
			expect(result.total).to.equal(6500);
			expect(result.currencyCode).to.equal('EUR');
			expect(result.qtyAvailable).to.equal(6);
			expect(result.rate).to.deep.equal(sabreResource.rate);
			expect(result.maxPrice).to.equal(false);
			expect(result.minPrice).to.equal(true);
		});
	});
	describe('Sync', function () {
		before(initializeLive);
		it('should synchronize availability', async function () {
			const arrival = new Date(sabreResource.verifyAvailabilityRequest.arrivalDate);
			const month = arrival.getUTCMonth() + 1;
			const year = arrival.getUTCFullYear();
			const result = await sabreSystem.getAvailabilityForBlock(
				companyDetails,
				sabreResource.destinationId,
				month,
				year,
				DateUtils.daysInMonth(month, year)
			);
			expect(result, 'No result from Sabre integration').to.exist;
			const arrivalString = RedisUtils.generateAvailabilityIndexKey(
				companyDetails.id,
				sabreResource.destinationId,
				RedisUtils.getIndexDate(year, month, arrival.getUTCDate())
			);
			const destination = result[arrivalString];
			expect(destination, 'Destination not found').to.exist;
			expect(destination.destinationId).to.equal(sabreResource.destinationId, 'Wrong destination ID');
			expect(destination.accommodations)
				.to.be.an('array', 'Invalid accommodation array')
				.with.length.greaterThan(0, 'No accommodations in array');
			const accommodation = destination.accommodations[0];
			expect(accommodation.price)
				.to.be.an('array', 'Invalid accommodation price array')
				.with.length.greaterThan(0, 'No accommodation prices');
			const price = accommodation.price[0];
			expect(price.rate).to.be.an('object').with.ownProperty('code').that.is.a('string');
			if (price.minStay !== undefined) {
				expect(price.minStay).to.be.a('number').at.least(1);
			}
			writeAvailabilityToCache(result);
		});
		// This often times out. Uncomment to test specific changes.
		it.skip('should synchronize upsell package availability', async function () {
			const arrival = new Date(sabreResource.verifyAvailabilityRequest.arrivalDate);
			const month = arrival.getUTCMonth() + 1;
			const year = arrival.getUTCFullYear();
			const result = await sabreSystem.getUpsellPackagesForBlock(
				companyDetails,
				sabreResource.destinationId,
				month,
				year,
				DateUtils.daysInMonth(month, year)
			);
			expect(result, 'No result from Sabre integration').to.exist;
			const arrivalString = RedisUtils.generateUpsellPackageIndexKey(
				sabreResource.destinationId,
				RedisUtils.getIndexDate(year, month, arrival.getUTCDate())
			);
			const day = result[arrivalString];
			expect(day, 'Day not found').to.exist;
			expect(day.destinationId).to.equal(sabreResource.destinationId, 'Wrong destination ID');
			expect(day.upsellPackages).to.be.an('array', 'Invalid package list');
			for (const upsellPackage of day.upsellPackages) {
				expect(upsellPackage.externalId).to.be.a('string', 'Invalid external ID').with.lengthOf.at.least(1);
				expect(upsellPackage.pricingType).to.be.a('string', 'Invalid pricing type').with.lengthOf.at.least(1);
			}
			await writeAvailabilityToCache(result);
		});
		it('should get rate code details', async function () {
			const result: IReservationSystem.Rate[] = await sabreSystem.getAvailableRateCodes(
				companyDetails,
				sabreResource.destinationId
			);
			expect(result).to.be.an('array').that.is.not.empty;
			const firstRate = result[0];
			expect(firstRate).to.haveOwnProperty('code');
			expect(firstRate).to.haveOwnProperty('name');
			expect(firstRate).to.haveOwnProperty('description');
		});

		async function writeAvailabilityToCache(result: AvailabilityCacheBlock | UpsellPackageCacheBlock) {
			for (let i in result) {
				const resultData = result[i];
				await redisClient.set(i, resultData);
			}
		}
	});
	describe('Making a Reservation', function () {
		before(initializeLive);
		it('should fail verification with an invalid rate code', async function () {
			sabreResource.verifyAvailabilityRequest.companyDetails = companyDetails;
			await setAvailabilityFromCache();
			const badRequest = ObjectUtils.deepClone(sabreResource.verifyAvailabilityRequest);
			badRequest.rateCode = 'INVALID_RATE_CODE';
			try {
				await sabreSystem.verifyAvailability(badRequest);
			} catch (e) {
				expect(e).to.exist;
				expect(e.err).to.equal('INTEGRATION_ERROR');
			}
		});
		it('should verify availability', async function () {
			sabreResource.verifyAvailabilityRequest.companyDetails = companyDetails;
			await setAvailabilityFromCache();
			try {
				const result = await sabreSystem.verifyAvailability(sabreResource.verifyAvailabilityRequest);

				chai.expect(result, 'No availability returned').to.exist;
				chai.expect(result.rateCode, 'No rate code found')
					.to.exist.and.be.a('string', 'Invalid rate code')
					.with.length.greaterThan(0, 'Rate code was an empty string');
				// Disabled because Sabre is currently not returning any package info
				//expect(result.upsellPackages).to.be.an('array').with.lengthOf(1);
				sabreResource.createReservationRequest.stay.rateCode = result.rateCode;
				sabreResource.createReservationRequest.stay.accommodationExternalId =
					sabreResource.verifyAvailabilityRequest.accommodation.externalId;
			} catch (e) {
				chai.expect(e).to.exist;
				if (e instanceof AssertionError) throw e;
				chai.expect(e.err, JSON.stringify(e)).to.equal('INTEGRATION_ERROR');
			}
		});
		it('should create a reservation', async function () {
			if (!!!sabreResource.createReservationRequest.stay.rateCode) this.skip();

			sabreResource.createReservationRequest.companyDetails = companyDetails;
			try {
				createdReservation = await sabreSystem.createReservation(sabreResource.createReservationRequest);
				expect(createdReservation, 'Empty response').to.exist;
				expect(createdReservation.id).to.exist.and.have.length.greaterThan(0);
				expect(createdReservation.confirmationId, 'No confirmation code').to.exist.and.have.length.at.least(1);
				expect(createdReservation.priceDetail).to.exist.and.be.an('object');
				expect(createdReservation.priceDetail.grandTotalCents).to.be.a('number').greaterThan(0);
				expect(createdReservation.metaData, 'No metadata').to.exist;
				reservationWasCreated = true;
			} catch (e) {
				logger.info(`Test failed, ${JSON.stringify(e)}`);
			}
		});
	});
	describe('Get a reservation', function () {
		before(async function () {
			if (!reservationWasCreated) this.skip();
			await initializeLive();
		});
		it('Should return the reservation', async function () {
			const request: IReservationSystem.GetReservation.Req = {
				companyDetails,
				destinationId: sabreResource.verifyAvailabilityRequest.destination.id,
				reservationConfirmationId: createdReservation.confirmationId
			};
			const result = await sabreSystem.getReservation(request);
			expect(result).to.exist;
			expect(result.prices.grandTotalCents).to.be.a('number', 'Invalid price');
		});
	});
	describe('Update a reservation', function () {
		before(async function () {
			if (!reservationWasCreated) this.skip();
			sabreResource.updateReservationRequest.companyDetails = companyDetails;
			sabreResource.updateReservationRequest.externalConfirmationId = createdReservation.confirmationId;
			sabreResource.updateReservationRequest.externalReservationId = createdReservation.id;
			sabreResource.updateReservationRequest.itineraryId = createdReservation.itineraryNumber;

			// const upsellPackage = await dbSingleton
			// 	.get()
			// 	.upsellPackage.getById(sabreResource.upsellPackageId, sabreResource.companyId);
			// sabreResource.updatedStay.upsellPackages = [{ id: upsellPackage.id, code: upsellPackage.code }];

			await setAvailabilityFromCache();
			sabreResource.updatedStay.accommodationExternalId =
				sabreResource.verifyAvailabilityRequest.accommodation.externalId;
			sabreResource.updatedStay.rateCode = sabreResource.verifyAvailabilityRequest.rateCode;
		});
		it('should update the guest', async function () {
			const primaryGuest = sabreResource.updatedGuest;
			const request: IReservationSystem.UpdateReservation.Req = {
				...sabreResource.createReservationRequest,
				...sabreResource.updateReservationRequest,
				primaryGuest
			};
			const result = await sabreSystem.updateReservation(request);
			expect(result, 'No result returned').to.exist;
			expect(result.id, 'Wrong ID').to.equal(createdReservation.id);
			expect(result.itineraryNumber, 'Wrong itinerary').to.equal(createdReservation.itineraryNumber);

			const reservation: ISabre.Reservation.Res.Get = result.metaData;
			expect(reservation, 'Result was not saved to metadata').to.exist;
			expect(reservation.Guests)
				.to.be.an('array', 'Invalid guest list')
				.with.lengthOf(1, 'Wrong number of guests');

			const resultGuest = reservation.Guests[0];
			expect(resultGuest.PersonName.GivenName).to.equal(primaryGuest.givenName, 'Wrong given name');
			expect(resultGuest.PersonName.Surname).to.equal(primaryGuest.surname, 'Wrong surname');
			expect(resultGuest.ContactNumbers, 'No phone numbers').to.be.an('array').with.length.of.at.least(1);
			expect(resultGuest.ContactNumbers[0].Number).to.equal(primaryGuest.phoneNumber, 'Wrong phone');
		});
		it('should update the stay', async function () {
			const guestCounts = sabreResource.updatedGuestCounts;
			const stay = sabreResource.updatedStay;
			const request: IReservationSystem.UpdateReservation.Req = {
				...sabreResource.createReservationRequest,
				...sabreResource.updateReservationRequest,
				guestCounts,
				stay
			};
			const result = await sabreSystem.updateReservation(request);
			expect(result, 'No result returned').to.exist;
			expect(result.id, 'Wrong ID').to.equal(createdReservation.id);
			expect(result.itineraryNumber, 'Wrong itinerary').to.equal(createdReservation.itineraryNumber);

			const reservation: ISabre.Reservation.Res.Get = result.metaData;
			expect(reservation, 'Result was not saved to metadata').to.exist;
			expect(reservation.RoomStay.GuestCount).to.be.an('array', 'Invalid guest count');

			const resultAdults = reservation.RoomStay.GuestCount.find((c) => c.AgeQualifyingCode === 'Adult');
			expect(resultAdults.NumGuests).to.equal(guestCounts.adultCount);

			const room = reservation.RoomStay.Products[0];
			const requestStartDate = new Date(stay.checkInDate);
			const requestEndDate = new Date(stay.checkOutDate);
			const resultStartDate = new Date(room.StartDate);
			const resultEndDate = new Date(room.EndDate);

			expect(requestStartDate.getUTCFullYear(), 'Wrong check-in year').to.equal(resultStartDate.getUTCFullYear());
			expect(requestStartDate.getUTCMonth(), 'Wrong check-in month').to.equal(resultStartDate.getUTCMonth());
			expect(requestStartDate.getUTCDate(), 'Wrong check-in day').to.equal(resultStartDate.getUTCDate());

			expect(requestEndDate.getUTCFullYear(), 'Wrong checkout year').to.equal(resultEndDate.getUTCFullYear());
			expect(requestEndDate.getUTCMonth(), 'Wrong checkout month').to.equal(resultEndDate.getUTCMonth());
			expect(requestEndDate.getUTCDate(), 'Wrong checkout day').to.equal(resultEndDate.getUTCDate());

			// const upsellPackage = reservation.Packages[0];
			// expect(upsellPackage, 'No package added').to.exist;
		});
		it.skip("should not remove or duplicate packages if they haven't changed", async function () {
			const guestCounts = sabreResource.createReservationRequest.guestCounts;
			const stay = sabreResource.updatedStay;
			const request: IReservationSystem.UpdateReservation.Req = {
				...sabreResource.createReservationRequest,
				...sabreResource.updateReservationRequest,
				guestCounts,
				stay
			};
			const result = await sabreSystem.updateReservation(request);
			expect(result, 'No result returned').to.exist;
			const reservation: ISabre.Reservation.Res.Get = result.metaData;
			expect(reservation, 'Result was not saved to metadata').to.exist;
			expect(reservation.Packages, 'Packages are gone')
				.to.exist.and.be.an('array', 'invalid packages')
				.with.lengthOf(1, 'Wrong number of packages');
		});
		it.skip('should remove packages', async function () {
			const stay = { ...sabreResource.updatedStay, upsellPackages: [] };
			const request: IReservationSystem.UpdateReservation.Req = {
				...sabreResource.createReservationRequest,
				...sabreResource.updateReservationRequest,
				stay
			};
			const result = await sabreSystem.updateReservation(request);
			expect(result).to.exist;
			const metadata: ISabre.Reservation.Res.Get = result.metaData;
			expect(metadata.Packages?.length).not.to.exist;
		});
	});
	describe.skip('Cancel', function () {
		before(async function () {
			companyDetails = await dbSingleton
				.get()
				.serviceKey.getServiceKeyAndCompanyDetails('RESERVATION', sabreResource.companyId);
			initializeLive();
		});
		it('should cancel a reservation', async () => {
			sabreResource.cancelReservationRequest.companyDetails = companyDetails;
			sabreResource.cancelReservationRequest.reservationId = createdReservation.id;
			sabreResource.cancelReservationRequest.reservationConfirmationId = createdReservation.confirmationId;
			const result = await sabreSystem.cancelReservation(sabreResource.cancelReservationRequest);
			expect(result, 'Empty response').to.exist;
			expect(result.cancellationId).to.be.a('string').with.length.at.least(1);
		});
	});

	async function setAvailabilityFromCache() {
		const destinationService = serviceFactory.get<DestinationService>('DestinationService');
		const availability = await destinationService.getAvailable(
			{
				adultCount: sabreResource.verifyAvailabilityRequest.adultCount,
				childCount: sabreResource.verifyAvailabilityRequest.childCount,
				startDate: sabreResource.verifyAvailabilityRequest.arrivalDate,
				sortOrder: 'ASC',
				endDate: sabreResource.verifyAvailabilityRequest.departureDate,
				pagination: { page: 1, perPage: 10 }
			},
			sabreResource.companyId
		);
		const availableDestination = (availability.data as Api.Destination.Res.Availability[]).find(
			(d) => d.id === sabreResource.destinationId
		);
		const availableAccommodation = availableDestination.accommodations.find(
			(acc) =>
				acc.prices.filter((p) => p.quantityAvailable > 0 && p.minStay <= sabreResource.nightsOfStay).length > 0
		);
		const localAccommodation = (await dbSingleton
			.get()
			.accommodation.getById(availableAccommodation.id, sabreResource.companyId)) as Model.Accommodation;

		sabreResource.verifyAvailabilityRequest.accommodation.id = availableAccommodation.id;
		sabreResource.verifyAvailabilityRequest.accommodation.externalId = localAccommodation.externalSystemId;
		const rate = availableAccommodation.prices.find(
			(p) => p.quantityAvailable > 0 && p.minStay <= sabreResource.nightsOfStay
		).rate;
		if (!rate) throw new RsError('INTEGRATION_ERROR', 'No valid rates found');
		sabreResource.verifyAvailabilityRequest.rateCode = rate.code;
	}
});
