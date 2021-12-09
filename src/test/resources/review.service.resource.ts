import ReviewTableMock from '../../database/mocks/review.db.mock';
import DestinationTableMock from '../../database/mocks/destination.db.mock';
import AccommodationTableMock from '../../database/mocks/accommodation.db.mock';
import { Create, Update } from '../../database/interfaces/IReviewTable';
import { DateUtils, StringUtils } from '../../utils/utils';
import UserTableMock from '../../database/mocks/user.db.mock';
import UserPermissionTableMock from '../../database/mocks/userPermission.db.mock';
import UserAddressTableMock from '../../database/mocks/userAddress.db.mock';

const companyId = 1;
const userId = 1;
const ratingAverage = 4.5;
const reservationId = 1;

const reviewTableMock = new ReviewTableMock({
	10: {
		id: 10,
		guest: {
			id: 1,
			firstName: 'First',
			lastName: 'Tester',
			accountNumber: 'firstTestUser',
			primaryEmail: 'First@testuser.com',
			phone: ''
		},
		destination: { id: 1, name: 'Test' },
		accommodation: { id: 2, name: 'test' },
		reservationId: 1,
		message: 'Prefill',
		rating: 5,
		createdOn: DateUtils.dbNow(),
		modifiedOn: null,
		verifiedOn: null,
		status: 'PENDING',
		packages: [],
		stayStartDate: null,
		stayEndDate: null
	},
	20: {
		id: 20,
		guest: {
			id: 1,
			firstName: 'First',
			lastName: 'Tester',
			accountNumber: 'firstTestUser',
			primaryEmail: 'First@testuser.com',
			phone: ''
		},
		destination: { id: 2, name: 'Test' },
		accommodation: { id: 6, name: 'test' },
		reservationId: 2,
		message: 'Prefill',
		rating: 5,
		createdOn: DateUtils.dbNow(),
		modifiedOn: null,
		verifiedOn: '2021-08-10',
		status: 'APPROVED',
		packages: [],
		stayStartDate: null,
		stayEndDate: null
	}
});
const accommodationTableMock = new AccommodationTableMock([
	{
		id: 1,
		companyId,
		destinationId: 1,
		accommodationTypeId: 1,
		propertyTypeId: 1,
		name: 'room',
		code: 'roomCode',
		shortDescription: '',
		longDescription: '',
		address1: '',
		address2: '',
		city: '',
		state: '',
		zip: '',
		country: '',
		bedroomCount: 1,
		bathroomCount: 1,
		floorCount: 1,
		createdOn: '',
		modifiedOn: '',
		status: 'ACTIVE',
		isPrivate: false,
		isRentReady: true,
		phase: '',
		lot: '',
		closingDate: '',
		houseView: '',
		furnitureDescription: '',
		kitchenDescription: '',
		modelDescription: '',
		managementCompany: '',
		maxOccupantCount: 100,
		maxSleeps: 50,
		propertyCode: '',
		agreementDate: '',
		propertyStatus: '',
		accommodationCode: '',
		priceCents: 0,
		metaData: '',
		externalSystemId: 'thisRoom',
		roomClass: null,
		bedDetails: [],
		extraBeds: 2,
		extraBedPriceCents: 0,
		adaCompliant: 0,
		heroUrl: '',
		size: null
	}
]);

const destinationTableMock = new DestinationTableMock(
	[
		{
			id: 1,
			companyId: 1,
			name: 'Fake Resort',
			status: 'Open',
			modifiedOn: new Date(),
			chainId: 10,
			externalSystemId: 'something',
			reviewRating: 5,
			reviewCount: 10,
			isActive: 1
		} as Model.Destination,
		{
			id: 2,
			companyId: 1,
			name: 'Another Fake Resort',
			status: 'Open',
			modifiedOn: new Date(),
			chainId: 10,
			externalSystemId: 'somethingelse',
			reviewRating: 5,
			reviewCount: 10,
			isActive: 1
		} as Model.Destination,
		{
			id: 3,
			companyId: 99,
			name: 'Yet Another Fake Resort',
			status: 'Open',
			modifiedOn: new Date(),
			chainId: 10,
			externalSystemId: 'stillsomething',
			reviewRating: 5,
			reviewCount: 10,
			isActive: 1
		} as Model.Destination
	],
	accommodationTableMock
);

const existingUser: Model.User[] = [
	{
		id: 1,
		companyId,
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
		createdOn: DateUtils.dbNow(),
		modifiedOn: DateUtils.dbNow(),
		joinedOn: DateUtils.dbNow(),
		birthDate: '',
		lastLoginOn: DateUtils.dbNow(),
		passwordResetGuid: StringUtils.generateGuid(),
		passwordResetExpiresOn: DateUtils.addDays(DateUtils.dbNow(), 2),
		gender: 'male',
		ethnicity: 'Kekistani',
		inactiveAfterDate: null,
		lifeTimePoints: 0,
		availablePoints: 0,
		loginExpiresOn: DateUtils.addDays(DateUtils.dbNow(), 2),
		loginVerificationExpiresOn: DateUtils.addDays(DateUtils.dbNow(), 2),
		loginVerificationGuid: StringUtils.generateGuid(),
		allowEmailNotification: 1
	}
];

const userRole: Model.UserRole[] = [
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
		createdOn: DateUtils.dbNow(),
		modifiedOn: DateUtils.dbNow(),
		isAdmin: 1,
		isCustomer: 0
	}
];

const userTableMock = new UserTableMock(
	existingUser,
	userRole,
	new UserPermissionTableMock(),
	new UserAddressTableMock()
);

const create: Omit<Create, 'status'> = {
	reservationId: 1,
	message: 'Test Review',
	rating: 1,
	userId
};

const update: Omit<Update, 'id'> = {
	message: 'Updated Test Review',
	rating: 4
};

const reviewResource = {
	userId,
	companyId,
	create,
	update,
	ratingAverage,
	reviewTableMock,
	destinationTableMock,
	userTableMock,
	reservationId
};

export default reviewResource;
