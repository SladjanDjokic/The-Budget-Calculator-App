import { DateUtils, NumberUtils, RedisUtils } from '../../utils/utils';
import UpsellPackageTableMock from '../../database/mocks/upsellPackage.db.mock';
import MediaServiceMock from '../../services/media/media.service.mock';
import RedisClientMock from '../../integrations/redis/redisClientMock';
import ReservationSystemMock from '../../integrations/reservationSystem/reservationSystem.mock';
import ReservationSystemProvider from '../../integrations/reservationSystem/reservationSystemProvider';
import ServiceKeyTableMock from '../../database/mocks/serviceKey.db.mock';
import { IReservationSystem } from '../../integrations/reservationSystem/reservationSystem.interface';

const companyId = 1;
const destinationId = 3;
const serviceKeyTableMock = new ServiceKeyTableMock();

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

const verification: Api.Reservation.Res.Verification = {
	checkInTime: '',
	arrivalDate: '',
	checkOutTime: '',
	departureDate: '',
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
		subtotalPoints: 2000,
		upsellPackageTotalInCents: 0,
		upsellPackageTotalPoints: 0,
		grandTotalCents: 11000,
		grandTotalPoints: 2000
	},
	rateCode: 'RATE',
	accommodationId: 1,
	accommodationName: 'ROOM',
	destinationName: 'DEST',
	upsellPackages: [],
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

const today = new Date();
const indexDate = RedisUtils.getIndexDate(today.getUTCFullYear(), today.getUTCMonth() + 1, today.getUTCDate());
const availabilityKey = RedisUtils.generateAvailabilityIndexKey(companyId, destinationId, indexDate);
const upsellPackageKey = RedisUtils.generateUpsellPackageIndexKey(destinationId, indexDate);

const redis = new RedisClientMock();

const reservationSystem = new ReservationSystemMock(
	availabilityKey,
	upsellPackageKey,
	verification,
	[],
	createdReservation,
	redis
);

const reservationSystemProvider = new ReservationSystemProvider(serviceKeyTableMock, { mock: reservationSystem });

const cacheStartDate = new Date();
const cacheLength = 20;
const cacheEndDate = DateUtils.addDays(new Date(cacheStartDate), cacheLength);

const packageUpdate: Omit<Api.UpsellPackage.Req.Update, 'id'> = {
	isActive: 0
};

const existingUpsellPackage: Api.UpsellPackage.Details = {
	id: 1,
	title: 'Test Package',
	externalTitle: 'Test Package',
	description: 'A fake package',
	code: 'TEST',
	companyId,
	destinationId,
	isActive: 1,
	media: [],
	startDate: null,
	endDate: null,
	pricingType: 'PerStay'
};

const cachedUpsellPackage: Redis.AvailableUpsellPackage = {
	id: existingUpsellPackage.id,
	externalId: existingUpsellPackage.code,
	priceDetail: { amountBeforeTax: 1000, amountAfterTax: 1100, amountPoints: NumberUtils.centsToPoints(1100) },
	pricingType: 'PerStay',
	quantity: 1,
	title: existingUpsellPackage.title,
	externalTitle: existingUpsellPackage.title
};

const mediaService = new MediaServiceMock();
const upsellPackageTable = new UpsellPackageTableMock([existingUpsellPackage]);

const stayLength = 5;
if (stayLength > cacheLength) throw new Error('Invalid test data: stay is longer than cache');
const availabilityRequest: Api.UpsellPackage.Req.Availability = {
	destinationId,
	pagination,
	startDate: new Date(),
	endDate: DateUtils.addDays(new Date(), stayLength)
};

const refreshCache = async function () {
	redis.reset();
	let currentDate = new Date(cacheStartDate);
	for (; currentDate <= cacheEndDate; DateUtils.addDays(currentDate, 1)) {
		const indexDate = RedisUtils.getIndexDate(
			currentDate.getUTCFullYear(),
			currentDate.getUTCMonth() + 1,
			currentDate.getUTCDate()
		);
		const key = RedisUtils.generateUpsellPackageIndexKey(destinationId, indexDate);
		const value: Redis.UpsellPackageAvailability = { destinationId, upsellPackages: [cachedUpsellPackage] };
		await redis.set(key, value);
	}
};

const packageResource = {
	companyId,
	destinationId,
	existingUpsellPackage,
	upsellPackageTable,
	mediaService,
	pagination,
	availabilityKey,
	upsellPackageKey,
	reservationSystemProvider,
	sort,
	filter,
	packageUpdate,
	availabilityRequest,
	redis,
	refreshCache
};
export default packageResource;
