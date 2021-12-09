import chai from 'chai';
import IReservationTable, { ReservationToUpdate } from '../../database/interfaces/IReservationTable';
import dbSingleton from '../../database/dbSingleton';
import reservationTableResource from '../resources/reservationTable.db.resource';
import { ObjectUtils, WebUtils } from '../../utils/utils';
import ReservationTable from '../../database/objects/reservation.db';
const expect = chai.expect;

describe('Reservation table', function () {
	let table: IReservationTable;
	let createdReservationIds: number[] = [];

	before(() => {
		table = dbSingleton.get().reservation;
	});

	after(async () => {
		if (!!!createdReservationIds.length) return;
		const result = await (table as ReservationTable).deleteManyForTest(createdReservationIds);
		expect(result).to.equal(createdReservationIds.length);
	});

	describe('Query functions', function () {
		it('should get destination details', async function () {
			const query = ReservationTable['destinationDetailQuery'];
			const result: Api.Reservation.DestinationDetails[] = await table.db.runQuery(query);
			expect(result).to.be.an('array');
			for (let destination of result) {
				expect(destination.experiences).to.be.an('array');
				for (let experience of destination.experiences) {
					expect(experience.id, 'Invalid experience ID').to.be.greaterThan(0);
					expect(experience.title, 'Invalid experience title')
						.to.be.a('string')
						.with.length.greaterThan(0, 'No title supplied');
				}
				expect(destination.packages).to.be.an('array');
			}
		});
	});

	describe('Create', function () {
		it('should save a reservation', async () => {
			let creationResult: Api.Reservation.Res.Get;
			try {
				creationResult = await table.create(reservationTableResource.createReservationRequest);
			} catch (err) {
				chai.assert(false, 'Create failed');
			}
			expect(creationResult, 'No result returned').to.exist;
			expect(creationResult.id, 'Invalid ID').to.be.above(0);
			createdReservationIds.push(creationResult.id);
			expect(creationResult.externalReservationId).to.equal(
				reservationTableResource.createReservationRequest.externalReservationId,
				'External ID does not match'
			);
			expect(creationResult.itineraryId).to.equal(
				reservationTableResource.createReservationRequest.itineraryId,
				'Itinerary ID does not match'
			);
			expect(creationResult.additionalDetails).to.equal(
				reservationTableResource.createReservationRequest.additionalDetails
			);
		});
		it('Should save reservation packages', async function () {
			if (!!!createdReservationIds.length) this.skip();
			await WebUtils.sleep(1000);
			const reservationPackages: Model.ReservationUpsellPackage[] = await table.db.runQuery(
				'SELECT * FROM reservationUpsellPackage WHERE reservationId = ?',
				[createdReservationIds[0]]
			);
			expect(reservationPackages).to.exist;
			expect(reservationPackages)
				.to.be.an('array')
				.and.have.length(reservationTableResource.upsellPackages.length);
			const packageIds = reservationTableResource.upsellPackages.map((p) => p.upsellPackageId);
			reservationPackages.forEach((upsellPackage) => {
				expect(packageIds).to.contain(upsellPackage.upsellPackageId);
				expect(upsellPackage.priceDetail).to.be.an('object');
			});
		});
	});

	describe('Get by ID', function () {
		let reservation: Api.Reservation.Res.Get;
		before(function () {
			if (!!!createdReservationIds.length) this.skip();
		});

		it('should get the reservation', async function () {
			reservation = await table.getById(createdReservationIds[0]);
			expect(reservation).to.exist;
			expect(reservation.id).to.equal(createdReservationIds[0]);
			expect(reservation.externalReservationId).to.be.a('string').with.length.at.least(1);
		});
		it('should include payment method', function () {
			const payment = reservation.paymentMethod;
			expect(payment, 'No payment method').to.exist.and.be.an('object', 'Payment method not parsed');
			expect(payment.nameOnCard).to.be.a('string').with.length.greaterThan(0);
			expect(payment.last4).to.be.a('number').greaterThan(0);
		});
		it('should include the destination', function () {
			const destination = reservation.destination;
			expect(destination, 'No destination').to.exist.and.be.an('object', 'Destination not parsed');
			expect(destination.address1, 'invalid address').to.be.a('string').with.length.above(0);
			expect(destination.name, 'Error: Name not found').to.be.a('string').with.length.above(0);
			expect(destination.externalId, 'No external ID returned').to.exist;
			expect(destination.companyId, 'Invalid company ID').to.be.a('number').greaterThan(0);
			expect(destination.experiences, 'Invalid experience array').to.be.an('array');
			for (let experience of destination.experiences) {
				expect(experience.id, 'Invalid experience ID').to.be.greaterThan(0);
				expect(experience.title, 'Invalid experience title')
					.to.be.a('string')
					.with.length.greaterThan(0, 'No title supplied');
			}
			testMediaArray(destination.media);
		});
		it('should include the accommodation', function () {
			const accommodation = reservation.accommodation;
			expect(accommodation, 'No accommodation').to.exist.and.be.an('object', 'accommodation was not parsed');
			expect(accommodation.featureIcons)
				.to.be.an('array')
				.with.length.at.most(5, 'returning too many feature icons');
			testMediaArray(accommodation.media);
		});
		it('should include price details', function () {
			const priceDetail = reservation.priceDetail;
			expect(priceDetail, 'No price details').to.exist.and.be.an('object', 'price details were not parsed');
			expect(priceDetail.grandTotalCents).to.be.a('number').above(0);
		});
		it('should include guest info', function () {
			const guest = reservation.guest;
			expect(guest, 'No guest info').to.exist.and.be.an('object', 'Guest info was not parsed');
			expect(guest.firstName, 'Wrong name').to.equal(
				reservationTableResource.createReservationRequest.guestFirstName
			);
		});
		it('should include packages', function () {
			const upsellPackages = reservation.upsellPackages;
			expect(upsellPackages)
				.to.be.an('array')
				.with.lengthOf(reservationTableResource.upsellPackages.length, 'No packages included');
			const firstUpsellPackage = upsellPackages[0];
			expect(firstUpsellPackage.description).to.be.a('string').with.length.of.at.least(1);
			expect(firstUpsellPackage.priceDetail)
				.to.be.an('object', 'Invalid price detail')
				.with.ownProperty(
					'amountBeforeTax',
					reservationTableResource.upsellPackages[0].priceDetail.amountBeforeTax,
					'Incorrect pricing'
				);
		});
	});

	describe('Add to itinerary', function () {
		before(function () {
			if (!!!createdReservationIds.length) this.skip();
		});
		it('should add a reservation with the same itinerary ID', async function () {
			const request = ObjectUtils.deepClone(reservationTableResource.createReservationRequest);
			request.externalConfirmationId = 'CONF' + new Date().getTime();
			request.externalReservationId = new Date().getTime().toString();
			request.parentReservationId = createdReservationIds[0];

			let creationResult: Api.Reservation.Res.Get;
			try {
				creationResult = await table.create(request);
			} catch (err) {
				chai.assert(false, 'Create failed');
			}
			expect(creationResult, 'No result returned').to.exist;
			expect(creationResult.id, 'Invalid ID').to.be.above(0);
			createdReservationIds.push(creationResult.id);
			expect(creationResult.itineraryId).to.equal(request.itineraryId);
		});
	});

	describe('Get itinerary', function () {
		before(function () {
			if (createdReservationIds.length < 2) this.skip();
		});
		let itinerary: Api.Reservation.Res.Itinerary.Get;
		it('should get an itinerary from a reservation', async function () {
			itinerary = await table.getItineraryByReservationId(createdReservationIds[0]);
			expect(itinerary, 'No result returned').to.exist;
			expect(itinerary.parentReservationId, 'Invalid parent ID')
				.to.be.a('number')
				.that.equals(createdReservationIds[0]);
			expect(itinerary.itineraryId, 'Invalid itinerary ID').to.equal(
				reservationTableResource.createReservationRequest.itineraryId
			);
			expect(itinerary.destination).to.be.an('object');
			expect(itinerary.stays)
				.to.be.an('array', 'Invalid stay list')
				.with.lengthOf(createdReservationIds.length, 'Wrong number of stays');
			const returnedIds = itinerary.stays.map((r) => r.reservationId);
			expect(createdReservationIds).to.contain.members(returnedIds, 'Returned extra stays');
			expect(returnedIds).to.contain.members(createdReservationIds, 'Missing stays');
		});
		it('should get an itinerary by itinerary ID', async function () {
			if (!itinerary) this.skip();
			const anotherItinerary: Api.Reservation.Res.Itinerary.Get = await table.getItinerary(itinerary.itineraryId);
			expect(anotherItinerary, 'No itinerary returned').to.exist;
			expect(anotherItinerary.itineraryId).to.equal(itinerary.itineraryId, 'Wrong itinerary ID');
			expect(anotherItinerary.parentReservationId).to.equal(itinerary.parentReservationId, 'Wrong parent ID');
			expect(anotherItinerary.stays.length).to.equal(itinerary.stays.length, 'wrong number of stays');
			expect(anotherItinerary.stays[0].guest).to.be.an('object');
		});
		it('should include payment method', function () {
			if (!!!itinerary) this.skip();
			const payment = itinerary.paymentMethod;
			expect(payment, 'No payment method').to.exist.and.be.an('object', 'Payment method not parsed');
			expect(payment.nameOnCard).to.be.a('string').with.length.greaterThan(0);
			expect(payment.last4).to.be.a('number').greaterThan(0);
		});
		it('should include the destination', async function () {
			if (!!!itinerary) this.skip();
			const destination = itinerary.destination;
			expect(destination, 'No destination').to.exist.and.be.an('object', 'Destination not parsed');
			expect(destination.address1, 'invalid address').to.be.a('string').with.length.above(0);
			expect(destination.name, 'Error: Name not found').to.be.a('string').with.length.above(0);
			expect(destination.externalId, 'No external ID returned').to.exist;
			const media = await dbSingleton.get().mediaMap.getByKeyId({ destinationId: destination.id });
			expect(destination.media.length).to.equal(media.length, 'wrong number of images');
		});
		it('should include the stay(s)', function () {
			if (!!!itinerary) this.skip();
			const stays = itinerary.stays;
			expect(stays, 'No stay').to.exist.and.be.an('array').with.length.at.least(1);
			for (let stay of stays) {
				expect(stay.externalReservationId).to.be.a('string').with.length.at.least(1);

				const priceDetail = stay.priceDetail;
				expect(priceDetail, 'No price details').to.exist.and.be.an('object', 'price details were not parsed');
				expect(priceDetail.grandTotalCents).to.be.a('number').above(0);

				const accommodation = stay.accommodation;
				expect(accommodation, 'No accommodation').to.exist.and.be.an('object', 'accommodation was not parsed');
				expect(accommodation.featureIcons)
					.to.be.an('array')
					.with.length.at.most(5, 'returning too many feature icons');
				const upsellPackages = stay.upsellPackages;
				expect(upsellPackages).to.be.an('array').with.lengthOf(reservationTableResource.upsellPackages.length);
				const firstUpsellPackage = upsellPackages[0];
				expect(firstUpsellPackage.description).to.be.a('string').with.length.of.at.least(1);
			}
		});
	});

	describe('Get itineraries by page', function () {
		it('should get a page of itineraries', async function () {
			const results: RedSky.RsPagedResponseData<
				Api.Reservation.Res.Itinerary.Get[]
			> = await table.getItinerariesByPage(
				reservationTableResource.pagination,
				reservationTableResource.sort,
				reservationTableResource.filter
			);
			expect(results, 'Invalid result').to.haveOwnProperty('data');
			expect(results, 'Invalid result').to.haveOwnProperty('total');
			expect(results.data, 'Invalid data').to.be.an('array').with.lengthOf.at.least(1);
			expect(results.data.length, 'Wrong number of results')
				.to.be.at.least(1)
				.and.at.most(reservationTableResource.pagination.perPage);
			for (const itinerary of results.data) {
				expect(itinerary.itineraryId).to.be.a('string');
				expect(itinerary.stays).to.be.an('array').with.lengthOf.at.least(1);
			}
		});
	});

	describe('Update', function () {
		before(function () {
			if (!!!createdReservationIds.length) this.skip();
		});
		it('should update a reservation without removing upsell packages', async function () {
			const originalReservation = await table.getById(
				createdReservationIds[0],
				reservationTableResource.companyId
			);
			const newDetails: string = originalReservation.additionalDetails + new Date().getTime().toString();
			const request: ReservationToUpdate = {
				additionalDetails: newDetails
			};
			const result = await table.update(createdReservationIds[0], request);
			expect(result.additionalDetails).to.equal(newDetails);
			expect(result.upsellPackages).to.deep.equal(originalReservation.upsellPackages);
		});
		it('should remove upsell packages when given an empty set', async function () {
			const request: ReservationToUpdate = {
				upsellPackages: []
			};
			const result = await table.update(createdReservationIds[0], request);
			expect(result.upsellPackages).to.be.an('array').with.lengthOf(0);
		});
	});

	describe('Cancel', function () {
		let itinerary: Api.Reservation.Res.Itinerary.Get;
		it('should mark a reservation cancelled', async function () {
			const result = await table.cancel(
				createdReservationIds[0],
				reservationTableResource.externalCancellationId
			);
			expect(result).to.equal(createdReservationIds[0]);
			const tableRecord = await table.getModelById(createdReservationIds[0]);
			expect(tableRecord.externalCancellationId).to.equal(reservationTableResource.externalCancellationId);
			expect(tableRecord.canceledOn).to.be.an.instanceOf(Date);
		});
		it('should still return the itinerary by ID', async function () {
			const createRequest = reservationTableResource.createReservationRequest;
			const result = await table.getItinerary(createRequest.itineraryId);
			expect(result, 'No result returned').to.exist;
			expect(result.stays.length).to.be.greaterThan(0, 'No stays returned');
			itinerary = result;
		});
		it('should only return the active reservations', async function () {
			if (!!!itinerary) this.skip();
			const reservationIds = itinerary.stays.map((s) => s.reservationId);
			expect(reservationIds.length).to.equal(createdReservationIds.length - 1, 'Wrong number of stays');
			expect(reservationIds).not.to.include(createdReservationIds[0], 'Included cancelled stay');
		});
		it('should still return the itinerary if the parent was cancelled', async function () {
			if (!!!itinerary) this.skip();
			const parentResult = await table.getItineraryByReservationId(createdReservationIds[0]);
			expect(parentResult).to.be.an('object', 'Invalid return');
			expect(parentResult).to.deep.include(itinerary, 'Itineraries do not match');
		});
	});

	function testMediaArray(mediaProperty: Api.Media[]) {
		expect(mediaProperty)
			.to.be.an('array', 'invalid media property')
			.with.lengthOf.at.least(1, 'no media in array');
		const media = mediaProperty[0];
		expect(media).to.haveOwnProperty('urls').that.is.an('object').that.is.not.empty;
	}
});
