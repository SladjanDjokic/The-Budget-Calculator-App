import RedisClientMock from '../../integrations/redis/redisClientMock';
import ReservationTableMock from '../../database/mocks/reservation.db.mock';
import { DateUtils, NumberUtils, RedisUtils, StringUtils } from '../../utils/utils';
import ReservationSystemProvider from '../../integrations/reservationSystem/reservationSystemProvider';
import ServiceKeyTableMock from '../../database/mocks/serviceKey.db.mock';
import ReservationSystemMock from '../../integrations/reservationSystem/reservationSystem.mock';
import DestinationTableMock from '../../database/mocks/destination.db.mock';
import AccommodationTableMock from '../../database/mocks/accommodation.db.mock';
import UserTableMock from '../../database/mocks/user.db.mock';
import UserPermissionTableMock from '../../database/mocks/userPermission.db.mock';
import UserAddressTableMock from '../../database/mocks/userAddress.db.mock';
import UserPaymentMethodTableMock from '../../database/mocks/userPaymentMethod.db.mock';
import UpsellPackageTableMock from '../../database/mocks/upsellPackage.db.mock';
import CompanyServiceMock from '../../services/company/company.service.mock';
import EmailServiceMock from '../../services/email/email.service.mock';
import UserPointServiceMock from '../../services/userPoint/userPoint.service.mock';
import { IReservationSystem } from '../../integrations/reservationSystem/reservationSystem.interface';
import VaultSystemProvider from '../../integrations/vaultSystem/vaultSystemProvider';
import VaultSystemMock from '../../integrations/vaultSystem/vaultSystem.mock';
import UserAddressServiceMock from '../../services/userAddress/userAddress.service.mock';
import CompanyTableMock from '../../database/mocks/company.db.mock';
import UserPointTableMock from '../../database/mocks/userPoint.db.mock';
import UserService from '../../services/user/user.service';
import UserCompletedCampaignTableMock from '../../database/mocks/userCompletedCampaign.db.mock';
import CampaignTableMock from '../../database/mocks/campaign.db.mock';
import UserActionTableMock from '../../database/mocks/userAction.db.mock';
import { ServiceName } from '../../services/serviceFactory';
import { Service } from '../../services/Service';
import TierTableMock from '../../database/mocks/tier.db.mock';
import TierFeatureTableMock from '../../database/mocks/tierFeature.db.mock';
import TierService from '../../services/tier/tier.service';
import PaymentServiceMock from '../../services/payment/payment.service.mock';
import RateTableMock from '../../database/mocks/rate.db.mock';

const now = new Date();
const companyId = 1;
const companyVariables: Model.CompanyVariables = {
	companyId,
	ap2FactorLoginTimeoutDays: 2,
	ap2FactorLoginVerificationTimeoutHours: 10,
	allowPointBooking: 1,
	allowCashBooking: 1,
	customPages: {},
	unauthorizedPages: []
};

const companyTable = new CompanyTableMock([
	{
		id: companyId
	} as Model.Company
]);

const destination: Model.Destination = {
	id: 2,
	companyId,
	name: 'Hotel California',
	description: 'You can check out any time you like',
	locationDescription: 'But you can never leave',
	code: 'HQC',
	city: 'Mohave',
	state: 'CA',
	zip: '11111',
	country: 'USA',
	externalSystemId: '987',
	modifiedOn: new Date(),
	chainId: 6,
	reviewRating: 5,
	reviewCount: 10,
	isActive: 1
} as Model.Destination;

const accommodation: Model.Accommodation = {
	id: 3,
	companyId,
	destinationId: destination.id,
	propertyTypeId: 1,
	accommodationTypeId: 5,
	name: 'Deluxe King Suite',
	code: 'DKS',
	shortDescription: 'short',
	longDescription: 'long',
	address1: '',
	address2: '',
	city: '',
	state: 'CA',
	zip: '11111',
	country: 'USA',
	bedroomCount: 12,
	bathroomCount: 1,
	floorCount: 2,
	createdOn: new Date(),
	modifiedOn: new Date(),
	status: 'ACTIVE',
	isPrivate: true,
	isRentReady: true,
	phase: '',
	lot: '',
	closingDate: null,
	houseView: '',
	furnitureDescription: 'Bed and couch',
	kitchenDescription: 'a place to cook food',
	modelDescription: '',
	managementCompany: '',
	maxOccupantCount: 14,
	maxSleeps: 6,
	propertyCode: 'string',
	agreementDate: new Date(0),
	propertyStatus: 'open',
	accommodationCode: 'DKS',
	priceCents: 11000,
	metaData: '',
	externalSystemId: 'DKS',
	roomClass: 'Deluxe',
	bedDetails: [],
	extraBeds: false,
	extraBedPriceCents: 0,
	adaCompliant: 1,
	heroUrl: '',
	size: null
};

const anotherAccommodation: Model.Accommodation = {
	...accommodation,
	id: new Date().getTime(),
	name: 'Another Accommodation',
	externalSystemId: 'Something completely different'
};

const searchOptions = {
	startDate: new Date().toISOString(),
	endDate: DateUtils.addDays(new Date(), 1).toISOString(),
	adults: 2
};

const user: Model.User = {
	id: 1,
	companyId: companyId,
	tierId: 0,
	userRoleId: 1,
	firstName: 'Test',
	lastName: 'Testington',
	primaryEmail: 'sumdood@example.com',
	accountNumber: 'account',
	phone: '',
	notes: '',
	password: '$2a$10$.Twdfx1/m1Wsmls/BYGDgOrKqZpNUmpgZcDHAeph6sYxh8u9g77tO', // hash of 'existingpassword'
	token: StringUtils.generateGuid(),
	resetPasswordOnLogin: 0,
	permissionLogin: 1,
	createdOn: now,
	modifiedOn: now,
	joinedOn: now,
	birthDate: '',
	lastLoginOn: now,
	passwordResetGuid: StringUtils.generateGuid(),
	passwordResetExpiresOn: DateUtils.addDays(new Date(), 2),
	gender: 'male',
	ethnicity: 'Kekistani',
	inactiveAfterDate: null,
	lifeTimePoints: 0,
	availablePoints: 0,
	loginExpiresOn: DateUtils.addDays(new Date(), 2),
	loginVerificationExpiresOn: DateUtils.addDays(new Date(), 4),
	loginVerificationGuid: StringUtils.generateGuid(),
	allowEmailNotification: 1
};

const guestUser: Model.User = { ...user, primaryEmail: 'guestaccount@fmail.com', permissionLogin: 0 };

const nonExistingGuest = {
	firstName: 'tester',
	lastName: 'testing',
	phone: user.phone,
	email: 'tester.testing@fakemail.com'
};

const userAddress: Model.UserAddress = {
	address1: '100 Proving Road',
	address2: null,
	city: 'Anywhereville',
	state: 'UT',
	zip: '84660',
	country: 'US',
	createdOn: DateUtils.addDays(new Date(), -10),
	modifiedOn: new Date(),
	id: 1,
	userId: user.id,
	isDefault: 1,
	name: 'Home Sweet Home',
	type: 'BOTH'
};

const paymentMethod: Model.UserPaymentMethod = {
	id: 1,
	userId: user.id,
	userAddressId: userAddress.id,
	token: 'CreditCardToken',
	nameOnCard: `${user.firstName} ${user.lastName}`,
	type: 'World Card',
	last4: 1111,
	expirationMonth: 10,
	expirationYear: 2025,
	cardNumber: null,
	isPrimary: 1,
	createdOn: DateUtils.addDays(new Date(), -10),
	systemProvider: 'adyen',
	metaData: '{}'
};

const existingPriceDetail: Api.Reservation.PriceDetail = {
	accommodationDailyCostsInCents: {
		[RedisUtils.getIndexDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())]: 100000
	},
	accommodationTotalInCents: 100000,
	feeTotalsInCents: [],
	taxTotalsInCents: [],
	taxAndFeeTotalInCents: 0,
	subtotalInCents: 100000,
	subtotalPoints: NumberUtils.centsToPoints(100000),
	upsellPackageTotalInCents: 0,
	upsellPackageTotalPoints: 0,
	grandTotalCents: 100000,
	grandTotalPoints: NumberUtils.centsToPoints(100000)
};

const existingReservation: Model.Reservation = {
	id: 1,
	userId: user.id,
	accommodationId: accommodation.id,
	destinationId: destination.id,
	guestFirstName: 'Tester',
	guestLastName: 'Testingberry',
	guestPhone: '8018675309',
	guestEmail: 'testingberry@example.com',
	rateCode: 'ITSTIME',
	bookingSourceId: 0,
	marketSegmentId: 0,
	orderId: 0,
	arrivalDate: new Date(),
	departureDate: DateUtils.addDays(new Date(), 1),
	status: 'Confirmed',
	createdOn: '06-06-2020',
	modifiedOn: new Date(),
	canceledOn: null,
	externalReservationId: 'res321',
	externalCancellationId: null,
	adultCount: 1,
	childCount: 0,
	externalConfirmationId: 'abcdef',
	confirmationDate: '06-06-2020',
	priceDetail: JSON.stringify(existingPriceDetail),
	userPaymentMethodId: paymentMethod.id,
	metaData: null,
	cancellationPermitted: 1,
	parentReservationId: null,
	infantCount: 0,
	nightCount: 1,
	itineraryId: null,
	additionalDetails: 'Some more information',
	numberOfAccommodations: 1,
	completedOn: null
};

const upsellPackage: Api.UpsellPackage.Res.Complete = {
	id: 1,
	companyId,
	title: 'Test Package',
	externalTitle: 'Test Package',
	code: 'PKG',
	destinationId: destination.id,
	description: 'A package for testing',
	isActive: 1,
	startDate: DateUtils.addDays(new Date(), -7),
	endDate: null,
	media: [],
	priceDetail: { amountBeforeTax: 10000, amountAfterTax: 10000, amountPoints: NumberUtils.centsToPoints(10000) },
	pricingType: 'PerStay'
};

const userPoints: Model.UserPoint[] = [
	{
		id: 1,
		userId: user.id,
		userActionId: 1,
		orderId: 0,
		rewardVoucherId: 0,
		campaignId: 0,
		campaignActionId: 0,
		reservationId: existingReservation.id,
		description: '',
		status: 'PENDING',
		pointType: 'BOOKING',
		pointAmount: 10000,
		reason: 'HOTEL_STAY',
		notes: '',
		createdOn: '',
		modifiedOn: '',
		availableOn: '',
		expireOn: ''
	}
];

const rates: IReservationSystem.Rate[] = [
	{
		code: 'TEST1',
		name: 'Test Rate 1',
		description: 'A rate for testing',
		destinationId: destination.id
	},
	{
		code: 'TEST2',
		name: 'Test Rate 2',
		description: 'A rate for testing',
		destinationId: destination.id
	}
];

const userAddressTable = new UserAddressTableMock([userAddress]);
const userPaymentMethodTable = new UserPaymentMethodTableMock({ 1: paymentMethod });
const accommodationTable = new AccommodationTableMock([accommodation, anotherAccommodation]);
const upsellPackageTable = new UpsellPackageTableMock([upsellPackage]);
const destinationTable = new DestinationTableMock([destination], accommodationTable);
const reservationTable = new ReservationTableMock(
	{ [existingReservation.id]: existingReservation },
	destinationTable,
	accommodationTable,
	userPaymentMethodTable,
	userAddressTable,
	upsellPackageTable
);
const rateTable = new RateTableMock(
	rates.map((rate, index) => {
		return { ...rate, id: index };
	})
);
const userTable = new UserTableMock(
	[user, guestUser],
	[
		{
			id: 1,
			name: 'Test user role',
			accessScope: [
				{
					accessScope: 'TEST',
					read: 1,
					write: 0
				}
			],
			createdOn: now,
			modifiedOn: now,
			isAdmin: 1,
			isCustomer: 0
		}
	],
	new UserPermissionTableMock([]),
	userAddressTable
);

const today = new Date();
const indexDate = RedisUtils.getIndexDate(today.getUTCFullYear(), today.getUTCMonth() + 1, today.getUTCDate());
const availabilityKey = RedisUtils.generateAvailabilityIndexKey(companyId, destination.id, indexDate);
const upsellPackageKey = RedisUtils.generateUpsellPackageIndexKey(destination.id, indexDate);

const redisClient = new RedisClientMock();

const tiers: { [key: number]: Model.Tier } = {
	1: {
		id: 525,
		name: 'Bronze',
		description: '',
		createdOn: now,
		modifiedOn: now,
		isActive: 1,
		accrualRate: 1,
		threshold: 0,
		isAnnualRate: 0
	}
};

let services: Partial<Record<ServiceName, Service>> = {};
services['UserPointService'] = new UserPointServiceMock(new UserPointTableMock(userPoints));
services['TierService'] = new TierService(new TierTableMock(tiers, []), new TierFeatureTableMock({}));
services['EmailService'] = new EmailServiceMock();
services['UserService'] = new UserService(
	userTable,
	userAddressTable,
	new UserPermissionTableMock(),
	new UserCompletedCampaignTableMock([], new CampaignTableMock()),
	new RedisClientMock(),
	new UserActionTableMock()
);
services['UserAddressService'] = new UserAddressServiceMock(new UserAddressTableMock());
services['CompanyService'] = new CompanyServiceMock(companyVariables);
services['PaymentService'] = new PaymentServiceMock();
for (let key in services) {
	services[key].start(services);
}
const availableAccommodations: Redis.Availability = {
	companyId,
	destinationId: destination.id,
	accommodations: [
		{
			id: 1,
			name: 'Test Accommodation',
			code: '',
			status: '',
			maxOccupancy: 12,
			maxSleeps: 4,
			roomClass: '',
			adaCompliant: 0,
			price: [
				{
					total: 10000,
					currencyCode: 'usd',
					qtyAvailable: 10,
					rate: { code: 'testRate', name: 'Test rate', description: 'A rate for testing' },
					maxPrice: false,
					minPrice: false
				}
			]
		}
	]
};

const serviceKeyTable = new ServiceKeyTableMock();

const verification: Api.Reservation.Res.Verification = {
	checkInTime: '',
	arrivalDate: new Date(),
	checkOutTime: '',
	departureDate: DateUtils.addDays(new Date(), 3),
	adultCount: 2,
	childCount: 0,
	maxOccupantCount: 10,
	prices: {
		accommodationDailyCostsInCents: {},
		accommodationTotalInCents: 10000,
		feeTotalsInCents: [],
		taxTotalsInCents: [],
		taxAndFeeTotalInCents: 1000,
		subtotalInCents: 11000,
		subtotalPoints: NumberUtils.centsToPoints(11000),
		upsellPackageTotalInCents: 1000,
		upsellPackageTotalPoints: 1000,
		grandTotalCents: 11000,
		grandTotalPoints: NumberUtils.centsToPoints(11000)
	},
	rateCode: 'RATE',
	accommodationId: 1,
	accommodationName: 'ROOM',
	destinationName: 'DEST',
	upsellPackages: [
		{ ...upsellPackage, priceDetail: { amountBeforeTax: 1000, amountAfterTax: 1000, amountPoints: 1000 } }
	],
	policies: null
};
const createdReservation: IReservationSystem.GetReservation.Res = {
	...verification,
	cancellationPermitted: true,
	reservationId: 'ID123',
	confirmationId: 'CONF123',
	itineraryId: 'IT123',
	guest: {
		firstName: 'Sumdood',
		lastName: 'Jones',
		email: 'sumdood@example.com',
		phone: '888-888-8888'
	},
	metadata: {},
	numberOfAccommodations: 1,
	additionalDetails: ''
};

const reservationSystem = new ReservationSystemMock(
	availabilityKey,
	upsellPackageKey,
	verification,
	rates,
	createdReservation,
	redisClient
);

const reservationSystemProvider = new ReservationSystemProvider(serviceKeyTable, { mock: reservationSystem });
const vaultSystemProvider = new VaultSystemProvider(serviceKeyTable, { mock: new VaultSystemMock() });

const verificationRequest: Api.Reservation.Req.Verification = {
	accommodationId: accommodation.id,
	destinationId: destination.id,
	adultCount: 2,
	childCount: 0,
	arrivalDate: DateUtils.addDays(new Date(), 32),
	departureDate: DateUtils.addDays(new Date(), 35),
	numberOfAccommodations: 1,
	upsellPackages: [{ id: upsellPackage.id }]
};

const createReservationRequest: Api.Reservation.Req.Create = {
	...verificationRequest,
	rateCode: 'RATE',
	paymentMethodId: paymentMethod.id,
	guest: {
		firstName: guestUser.firstName,
		lastName: guestUser.lastName,
		phone: guestUser.phone,
		email: guestUser.primaryEmail
	},
	additionalDetails: 'this is a create reservation request comment'
};
const pmData: Api.Payment.PmData = {
	address1: '',
	address2: '',
	callback_url: '',
	card_type: '',
	city: '',
	company: '',
	country: '',
	created_at: '',
	data: '',
	eligible_for_card_updater: false,
	email: '',
	errors: [],
	fingerprint: '',
	first_name: '',
	first_six_digits: 0,
	full_name: '',
	last_four_digits: 0,
	last_name: '',
	metadata: undefined,
	month: 0,
	number: '',
	payment_method_type: '',
	phone_number: '',
	shipping_address1: '',
	shipping_address2: '',
	shipping_city: '',
	shipping_country: '',
	shipping_phone_number: '',
	shipping_state: '',
	shipping_zip: '',
	state: '',
	storage_state: '',
	test: false,
	token: '',
	updated_at: undefined,
	verification_value: '',
	year: 0,
	zip: ''
};
const itineraryNewAddres: Api.Reservation.Req.Itinerary.UserAddressCreate = {
	address1: '',
	city: '',
	country: '',
	isDefault: 1,
	type: undefined,
	zip: 0
};
const createItineraryRequest: Api.Reservation.Req.Itinerary.Create = {
	destinationId: destination.id,
	paymentMethodId: paymentMethod.id,
	newAddress: itineraryNewAddres,
	payment: {
		cardToken: '',
		pmData
	},
	stays: [
		{
			accommodationId: accommodation.id,
			rateCode: createReservationRequest.rateCode,
			numberOfAccommodations: 1,
			arrivalDate: verificationRequest.arrivalDate,
			departureDate: verificationRequest.departureDate,
			adultCount: 2,
			childCount: 0,
			guest: {
				firstName: guestUser.firstName,
				lastName: guestUser.lastName,
				phone: guestUser.phone,
				email: guestUser.primaryEmail
			},
			upsellPackages: [{ id: upsellPackage.id }],
			additionalDetails: 'First stay comment'
		},
		{
			accommodationId: accommodation.id,
			rateCode: createReservationRequest.rateCode,
			numberOfAccommodations: 1,
			arrivalDate: DateUtils.addDays(new Date(verificationRequest.departureDate), 4),
			departureDate: DateUtils.addDays(new Date(verificationRequest.departureDate), 7),
			adultCount: 1,
			childCount: 2,
			guest: {
				firstName: guestUser.firstName,
				lastName: guestUser.lastName,
				phone: guestUser.phone,
				email: guestUser.primaryEmail
			},
			upsellPackages: [{ id: upsellPackage.id }],
			additionalDetails: 'Second stay comment'
		}
	]
};

const updateReservationRequest: Api.Reservation.Req.Update = {
	id: existingReservation.id,
	accommodationId: anotherAccommodation.id,
	rateCode: 'AnotherRate',
	numberOfAccommodations: 1,
	arrivalDate: verificationRequest.arrivalDate,
	departureDate: verificationRequest.departureDate,
	additionalDetails: 'Updated reservation comment',
	upsellPackages: [{ id: upsellPackage.id }]
};

const cancelReservationId = existingReservation.id;

const newAddress: Api.UserAddress.Req.Create = {
	type: 'SHIPPING',
	address1: '175 N main st',
	city: 'spanish fork',
	state: 'UT',
	zip: 84660,
	country: 'US',
	isDefault: 0
};

const reservationResource = {
	companyId,
	user,
	destination,
	companyService: services['CompanyService'],
	companyTable,
	searchOptions,
	reservationTable,
	destinationTable,
	accommodationTable,
	upsellPackageTable,
	userAddressTable,
	guestUser,
	nonExistingGuest,
	userTable,
	rateTable,
	userPoints,
	userPaymentMethodTable,
	redisClient,
	emailService: services['EmailService'],
	userPointService: services['UserPointService'],
	availabilityKey,
	upsellPackageKey,
	availableAccommodations,
	reservationSystemProvider,
	vaultSystemProvider,
	reservationSystem,
	verificationRequest,
	createReservationRequest,
	createItineraryRequest,
	existingReservation,
	updateReservationRequest,
	cancelReservationId,
	companyVariables,
	userAddressService: services['UserAddressService'],
	newAddress,
	userService: services['UserService'],
	paymentService: services['PaymentService']
};

export default reservationResource;
