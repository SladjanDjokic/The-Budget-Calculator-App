import { DateUtils } from '../../utils/utils';
import DestinationTableMock from '../../database/mocks/destination.db.mock';
import MediaServiceMock from '../../services/media/media.service.mock';
import DestinationSystemMock from '../../integrations/destinationSystem/destinationSystem.mock';
import DestinationSystemProvider from '../../integrations/destinationSystem/destinationSystemProvider';
import ServiceKeyTableMock from '../../database/mocks/serviceKey.db.mock';
import AccommodationTableMock from '../../database/mocks/accommodation.db.mock';
import CompanyServiceMock from '../../services/company/company.service.mock';

const companyId = 1;

const destinationId = 1;

const companyVariables: Model.CompanyVariables = {
	companyId: 1,
	ap2FactorLoginTimeoutDays: 2,
	ap2FactorLoginVerificationTimeoutHours: 10,
	allowPointBooking: 1,
	allowCashBooking: 1,
	customPages: {},
	unauthorizedPages: []
};

const availableAccommodations: Redis.Availability = {
	companyId,
	destinationId: destinationId,
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

const accommodationTable = new AccommodationTableMock([
	{
		id: availableAccommodations.accommodations[0].id,
		companyId,
		destinationId,
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

const destinationTable = new DestinationTableMock(
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
	accommodationTable
);
const today = new Date();

const pagination: RedSky.PagePagination = {
	page: 1,
	perPage: 1
};

const sort: RedSky.SortQuery = {
	field: 'id',
	order: 'ASC'
};

const filter: RedSky.FilterQuery = {
	matchType: 'exact',
	searchTerm: []
};

const destinationUpdate: Omit<Api.Destination.Req.Update, 'id'> = {
	description: 'Test Detination Update'
};

const availability: Api.Destination.Req.Availability = {
	startDate: today.toISOString(),
	endDate: DateUtils.addDays(new Date(), 3).toISOString(),
	sortOrder: 'ASC',
	adultCount: 2,
	childCount: 1,
	pagination
};

const redisKey = `1-${today.getFullYear()}-${DateUtils.padStart(
	(today.getMonth() + 1).toString()
)}-${DateUtils.padStart(today.getUTCDate().toString())}`;

const mediaService = new MediaServiceMock();
const companyService = new CompanyServiceMock(companyVariables);

const serviceKeyTable = new ServiceKeyTableMock();

const destinationSystemProvider = new DestinationSystemProvider(serviceKeyTable, {
	mock: new DestinationSystemMock()
});

export default interface DestinationServiceResource {
	companyId: number;
	destinationTable: DestinationTableMock;
	pagination: RedSky.PagePagination;
	sort: RedSky.SortQuery;
	filter: RedSky.FilterQuery;
	destinationUpdate: Omit<Api.Destination.Req.Update, 'id'>;
	availability: Api.Destination.Req.Availability;
	availableDestinationId: number;
	mediaService: MediaServiceMock;
	destinationSystemProvider: DestinationSystemProvider;
	redisKey: string;
	availableAccommodations: Redis.Availability;
	companyService: CompanyServiceMock;
}

export const destinationResource: DestinationServiceResource = {
	companyId,
	destinationTable,
	pagination,
	sort,
	filter,
	destinationUpdate,
	availability,
	availableDestinationId: destinationId,
	mediaService,
	destinationSystemProvider,
	redisKey,
	availableAccommodations,
	companyService
};
