import chai from 'chai';
import ReservationService from '../../services/reservation/reservation.service';
import reservationResource from '../resources/reservation.service.resource';
import { DateUtils, ObjectUtils } from '../../utils/utils';
import { IReservationSystem } from '../../integrations/reservationSystem/reservationSystem.interface';
import { RsError } from '../../utils/errors';
import UserService from '../../services/user/user.service';
import reservationServiceResource from '../resources/reservation.service.resource';
const expect = chai.expect;

describe('Reservation Service', function () {
	let reservationService: ReservationService;
	let userService: UserService;
	async function initialize() {
		reservationResource.redisClient.reset();
		await reservationResource.redisClient.set(
			reservationResource.availabilityKey,
			reservationResource.availableAccommodations
		);
		reservationResource.reservationSystem.reset();
		reservationService = new ReservationService(
			reservationServiceResource.reservationTable,
			reservationResource.destinationTable,
			reservationResource.accommodationTable,
			reservationResource.upsellPackageTable,
			reservationResource.rateTable,
			reservationResource.userTable,
			reservationResource.userPaymentMethodTable,
			reservationResource.companyTable,
			reservationResource.redisClient,
			reservationResource.reservationSystemProvider,
			reservationResource.vaultSystemProvider
		);
		userService = reservationServiceResource.userService as UserService;
		reservationService.start({
			UserPointService: reservationResource.userPointService,
			EmailService: reservationResource.emailService,
			UserAddressService: reservationResource.userAddressService,
			UserService: reservationServiceResource.userService,
			PaymentService: reservationServiceResource.paymentService
		});
	}

	describe('Pull Refresh keys', function () {
		beforeEach(initialize);
		it('should pull the available refresh keys', async function () {
			const result = await reservationService.getAvailabilityRefreshKeys(reservationResource.companyId);
			chai.expect(result).to.exist;
			chai.expect(result).to.be.an('object');
			chai.expect(reservationResource.reservationSystem.getRefreshKeysCalls).to.be.greaterThan(0);
		});
	});
	describe('Sync a reservation block', function () {
		beforeEach(initialize);
		it('should pull back synchronized data for the given block', async function () {
			const accommodationBlock = await reservationService.syncAvailabilityBlock(
				reservationResource.companyId,
				reservationResource.availabilityKey
			);

			expect(accommodationBlock).to.exist;
			expect(
				accommodationBlock[reservationResource.availabilityKey],
				`Missing accommodation block for ${reservationResource.availabilityKey}`
			).to.exist;
			expect(accommodationBlock[reservationResource.availabilityKey])
				.to.have.own.property('companyId')
				.that.equals(reservationResource.companyId);
			expect(accommodationBlock[reservationResource.availabilityKey])
				.to.have.own.property('destinationId')
				.that.equals(reservationResource.destination.id);
			expect(accommodationBlock[reservationResource.availabilityKey])
				.to.have.own.property('accommodations')
				.that.is.an('array', 'invalid accommodation list');
			expect(reservationResource.redisClient.values[reservationResource.availabilityKey]).to.eql(
				JSON.stringify(accommodationBlock[reservationResource.availabilityKey]),
				'accommodation lists do not match'
			);
		});
	});
	describe('Sync rates', function () {
		before(initialize);
		it("should get rates for a company's destinations", async function () {
			await reservationService.syncRates();
			const rates: Model.Rate[] = await reservationResource.rateTable.getByDestinationId(
				reservationResource.destination.id
			);
			expect(rates).to.be.an('array').with.length.at.least(reservationResource.reservationSystem.rates.length);
		});
	});
	describe('Final booking process', () => {
		beforeEach(initialize);
		it('should verify the availability with the reservation system', async () => {
			const result = await reservationService.verifyAvailability(reservationResource.verificationRequest);
			chai.expect(result).to.exist;
			chai.expect(reservationResource.reservationSystem.verifyAvailabilityCalls).to.be.greaterThan(0);
		});
		describe('Book stays', function () {
			beforeEach(initialize);
			before(() => {
				reservationResource.reservationSystem.reset();
			});
			it('should gather local data and create reservations', async () => {
				const result = await reservationService.createItinerary({
					...reservationResource.createItineraryRequest,
					userId: reservationResource.user.id,
					newAddress: reservationResource.newAddress
				});
				chai.expect(result, 'No result returned').to.exist;
				chai.expect(result.stays.length, 'Number of stays does not match').to.equal(
					reservationResource.createItineraryRequest.stays.length
				);
				chai.expect(
					reservationResource.reservationSystem.createReservationCalls,
					'Number of calls and number of stays do not match'
				).to.equal(reservationResource.createItineraryRequest.stays.length);
				const reservationSystemRequest = reservationResource.reservationSystem
					.mostRecentCreateRequest as IReservationSystem.CreateReservation.Req;
				expect(reservationSystemRequest, 'No reservation system request found').to.exist;
				expect(reservationSystemRequest)
					.to.haveOwnProperty('primaryGuest')
					.that.haveOwnProperty('givenName')
					.that.equals(reservationResource.user.firstName);
				const lastStay =
					reservationResource.createItineraryRequest.stays[
						reservationResource.createItineraryRequest.stays.length - 1
					];
				expect(reservationSystemRequest.stay, 'invalid upsell package property')
					.to.haveOwnProperty('upsellPackages')
					.that.is.an('array')
					.with.lengthOf(lastStay.upsellPackages?.length, 'Wrong number of upsell packages');
				expect(reservationSystemRequest, 'missing additional details')
					.to.haveOwnProperty('additionalDetails')
					.that.equals(lastStay.additionalDetails);
				const upsellPackage = reservationSystemRequest.stay.upsellPackages[0];
				expect(upsellPackage, 'Package does not exist').to.exist;
				expect(lastStay.upsellPackages.map((p) => p.id)).to.contain(upsellPackage.id, 'Wrong package added');
				expect(upsellPackage.code, 'Invalid external ID').to.be.a('string').with.length.of.at.least(1);
				const packages = reservationResource.reservationTable.lastRequest.upsellPackages;
				expect(packages, 'Packages do not exist').to.exist;
			});
			it('should throw an address is required error when attempting to create itinerary with no address', async function () {
				try {
					await reservationService.createItinerary({
						...reservationResource.createItineraryRequest,
						userId: reservationResource.user.id
					});
				} catch (e) {
					chai.expect(e.err).to.exist.and.equal('BAD_REQUEST');
					chai.expect(e.msg).to.exist.and.equal('Address is required');
				}
			});
		});
	});

	describe('Update reservation', function () {
		beforeEach(initialize);
		it('should check availability before adding days', async function () {
			const updateRequest: Api.Reservation.Req.Update = {
				id: reservationResource.existingReservation.id,
				departureDate: DateUtils.addDays(new Date(reservationResource.existingReservation.departureDate), 1)
			};
			await reservationService.update(updateRequest, reservationResource.existingReservation.userId);
			expect(reservationResource.reservationSystem.verifyAvailabilityCalls).to.equal(1);
		});
		it('should update a reservation', async function () {
			const originalReservation = {
				...(await reservationResource.reservationTable.getById(
					reservationResource.existingReservation.id,
					reservationResource.companyId
				))
			};
			const request = reservationResource.updateReservationRequest;
			const result = await reservationService.update(request, reservationResource.user.id);
			expect(result, 'No result returned').to.exist;
			expect(result.paymentMethod.id, 'Payment should not have changed').to.equal(
				originalReservation.paymentMethod.id
			);

			const externalRequest = reservationResource.reservationSystem.mostRecentUpdateRequest;
			expect(externalRequest.stay.arrivalDate).to.equal(
				request.arrivalDate,
				'wrong arrival sent to reservation system'
			);
			expect(externalRequest.stay.departureDate).to.equal(
				request.departureDate,
				'wrong departure sent to reservation system'
			);

			const savedReservation = await reservationResource.reservationTable.getById(
				result.id,
				reservationResource.companyId
			);
			expect(savedReservation.arrivalDate).to.equal(
				reservationResource.reservationSystem.reservation.arrivalDate,
				'wrong arrival sent to database'
			);
			expect(savedReservation.departureDate).to.equal(
				reservationResource.reservationSystem.reservation.departureDate,
				'wrong departure sent to database'
			);
		});
		it('should update a reservation without changing packages', async function () {
			const originalReservation = ObjectUtils.deepClone(
				await reservationResource.reservationTable.getById(
					reservationResource.existingReservation.id,
					reservationResource.companyId
				)
			);
			const request: Api.Reservation.Req.Update = ObjectUtils.deepClone(
				reservationResource.updateReservationRequest
			);
			delete request.upsellPackages;
			const result = await reservationService.update(request, reservationResource.user.id);
			expect(result.upsellPackages)
				.to.be.an('array', 'invalid upsell package array')
				.with.lengthOf(originalReservation.upsellPackages.length, 'wrong number of upsell packages');
		});
		it('should not update a point-based reservation without enough points', function () {
			reservationResource.user.availablePoints = 0;
			const updateRequest: Api.Reservation.Req.Update = {
				id: reservationResource.existingReservation.id,
				departureDate: DateUtils.addDays(new Date(reservationResource.existingReservation.departureDate), 3)
			};
			expect(reservationService.update(updateRequest, reservationResource.user.id)).to.eventually.throw(RsError);
		});
	});

	describe('Complete Booking', () => {
		it('should set reservation to completed and award points', async () => {
			const beforeUser = await userService.getById(reservationResource.user.id);
			await reservationService.completeReservation({
				confirmationCode: reservationResource.existingReservation.externalConfirmationId
			});
			const afterUser = await userService.getById(reservationResource.user.id);
			chai.expect(afterUser.lifeTimePoints - beforeUser.lifeTimePoints).to.equal(
				reservationResource.userPoints[0].pointAmount
			);
		});
	});

	describe('Cancellation', () => {
		beforeEach(initialize);
		it('should send the cancellation to the reservation system', async () => {
			const result = await reservationService.cancelReservation(reservationResource.cancelReservationId);
			chai.expect(result, 'No result returned').to.exist;
			chai.expect(
				reservationResource.reservationSystem.cancelReservationCalls,
				'No cancel call recorded'
			).to.equal(1);
		});
	});

	describe('Guest Checkout', () => {
		beforeEach(initialize);
		it('should create a new reservation without an existing user and not sign up for spire', async () => {
			const itinerary = reservationResource.createItineraryRequest;
			itinerary.stays.forEach((stay) => (stay.guest = reservationResource.nonExistingGuest));
			const result = await reservationService.createItinerary(itinerary);
			const user = await userService.getUserForEmail(reservationResource.nonExistingGuest.email);
			chai.expect(user, 'no user with email').to.exist.and.haveOwnProperty('permissionLogin').that.equals(0);
			chai.expect(result, 'failed to create reservation').to.exist;
			chai.expect(result, 'reservation not attached to correct user')
				.to.haveOwnProperty('userId')
				.that.equals(user.id);
		});
		it('should create a new reservation to an existing user not signed up for spire', async () => {
			//check that exists and not signed up for spire before the others
			let user = await userService.getUserForEmail(reservationResource.nonExistingGuest.email);
			chai.expect(user, 'invalid guest user').to.exist.and.to.haveOwnProperty('permissionLogin').that.equals(0);
			const result = await reservationService.createItinerary(reservationServiceResource.createItineraryRequest);
			user = await userService.getUserForEmail(reservationResource.nonExistingGuest.email);
			chai.expect(user, 'did not stay as guest').to.exist.and.haveOwnProperty('permissionLogin').that.equals(0);
			chai.expect(result).to.exist;
		});
		it('should create a new reservation without an existing user and sign up for spire', async () => {
			const itinerary = reservationResource.createItineraryRequest;
			itinerary.userId = undefined;
			itinerary.signUp = 1;
			itinerary.stays.forEach((stay) => (stay.guest = reservationResource.nonExistingGuest));
			const result = await reservationService.createItinerary(itinerary);
			const user = await userService.getUserForEmail(reservationResource.nonExistingGuest.email);
			chai.expect(user).to.exist.and.haveOwnProperty('permissionLogin').that.equals(1);
			chai.expect(result).to.exist;
		});
	});
});
