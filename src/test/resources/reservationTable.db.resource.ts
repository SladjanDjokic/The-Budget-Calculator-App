import { DateUtils } from '../../utils/utils';
import { ReservationToSave, ReservationUpsellPackageToSave } from '../../database/interfaces/IReservationTable';

const companyId = 1;
const userId = 1;
const accommodationId = 18;
const userPaymentMethodId = 33;
const arrivalDate = DateUtils.addDays(new Date(), 7);
const destinationId = 3;
const upsellPackages: ReservationUpsellPackageToSave[] = [
	{ upsellPackageId: 7, priceDetail: { amountBeforeTax: 1000, amountAfterTax: 1100, amountPoints: 2000 } }
];

const createReservationRequest: ReservationToSave = {
	userId,
	destinationId,
	accommodationId,
	guestFirstName: 'Test',
	guestLastName: 'Tester\nTesting',
	guestPhone: '7654321111',
	guestEmail: 'test@example.com',
	rateCode: 'ITSTIME',
	bookingSourceId: null,
	marketSegmentId: null,
	orderId: null,
	arrivalDate,
	departureDate: DateUtils.addDays(new Date(arrivalDate), 2),
	status: '',
	externalReservationId: new Date().getTime().toString(),
	externalCancellationId: null,
	adultCount: 1,
	childCount: 0,
	confirmationDate: new Date(),
	userPaymentMethodId,
	priceDetail: {
		accommodationDailyCostsInCents: { [arrivalDate.toString()]: 1000 },
		accommodationTotalInCents: 1000,
		feeTotalsInCents: [{ name: 'Test Fee', amount: 100 }],
		taxTotalsInCents: [{ name: 'Test Tax', amount: 200 }],
		taxAndFeeTotalInCents: 300,
		subtotalInCents: 1300,
		subtotalPoints: 1000,
		upsellPackageTotalInCents: 1100,
		upsellPackageTotalPoints: 2000,
		grandTotalCents: 2400,
		grandTotalPoints: 3000
	},
	metaData: '{"test":"successful"}',
	cancellationPermitted: 0,
	externalConfirmationId: 'CONF' + new Date().getTime(),
	parentReservationId: null,
	itineraryId: 'IT' + new Date().getTime(),
	upsellPackages,
	additionalDetails: 'test comment',
	numberOfAccommodations: 1
};

const externalCancellationId = 'CANCEL' + new Date().getTime().toString();

const pagination: RedSky.PagePagination = {
	page: 1,
	perPage: 5
};

const filter: RedSky.FilterQuery = null;
const sort: RedSky.SortQuery = {
	field: 'itineraryId',
	order: 'DESC'
};

const reservationTableResource = {
	companyId,
	createReservationRequest,
	externalCancellationId,
	upsellPackages,
	pagination,
	filter,
	sort
};

export default reservationTableResource;
