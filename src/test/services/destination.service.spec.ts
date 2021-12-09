import chai from 'chai';
import DestinationService from '../../services/destination/destination.service';
import DestinationServiceResource, {
	destinationResource as originalResource
} from '../resources/destination.service.resource';
import { ObjectUtils } from '../../utils/utils';
import dbSingleton from '../../database/dbSingleton';
import liveRedisClient from '../../integrations/redis/client';
import RedisClientMock from '../../integrations/redis/redisClientMock';
const expect = chai.expect;

describe('DestinationService', () => {
	let localResource: DestinationServiceResource;
	let destinationService: DestinationService;
	const redisClient = new RedisClientMock();

	async function initialize() {
		localResource = ObjectUtils.deepClone(originalResource);
		redisClient.reset();
		await redisClient.set(localResource.redisKey, localResource.availableAccommodations);
		destinationService = new DestinationService(
			localResource.destinationTable,
			localResource.destinationSystemProvider,
			redisClient
		);
		destinationService.start({
			MediaService: localResource.mediaService,
			CompanyService: localResource.companyService
		});
	}

	describe('Get destination(s)', () => {
		beforeEach(initialize);
		it('should get a destination object by its ID.', async () => {
			const destinationToTest = localResource.destinationTable.Destinations[0];
			const destination = await destinationService.getById(destinationToTest.id, destinationToTest.companyId);
			expect(destination).to.exist;
			expect(destination).to.equal(destinationToTest);
		});
		it('should get multiple destination objects by their IDs', async () => {
			const destinationsToTest = localResource.destinationTable.Destinations.filter(
				(d) => d.companyId == localResource.companyId
			);
			const idsToTest: number[] = destinationsToTest.map((d) => d.id);
			const destinations = await destinationService.getManyByIds(idsToTest, localResource.companyId);
			expect(destinations).to.exist;
			expect(destinations.length).to.equal(idsToTest.length);
			expect(destinations).to.eql(destinationsToTest);
		});
		it('should get destination details by page', async function () {
			destinationService = new DestinationService(
				dbSingleton.get().destination,
				localResource.destinationSystemProvider,
				liveRedisClient
			);
			destinationService.start({
				MediaService: localResource.mediaService,
				CompanyService: localResource.companyService
			});
			const pagedResults = await destinationService.getByPage(
				localResource.pagination,
				localResource.sort,
				localResource.filter,
				localResource.companyId
			);
			expect(pagedResults).to.exist;
			expect(pagedResults.data).to.be.an('array');
			expect(pagedResults.total).to.be.a('number');
			expect(pagedResults.data.length).to.equal(1);
			expect(pagedResults.data[0]).to.haveOwnProperty('id');
			expect(pagedResults.data[0].media).to.be.an('array');
			expect(pagedResults.data[0].experiences).to.be.an('array');
			expect(pagedResults.data[0].packages).to.be.an('array');
			expect(pagedResults.data[0].accommodations).to.be.an('array');
			expect(pagedResults.data[0].accommodationTypes).to.be.an('array');
		});
	});
	xdescribe('Get available destination(s)', () => {
		before(initialize);
		it('should get correct availability', async () => {
			const result = await destinationService.getAvailable(localResource.availability, localResource.companyId);
			expect(result).to.exist;
			expect(result.data).to.be.an('array', 'no data returned').with.length.greaterThan(0, 'empty dataset');

			const destination = result.data[0] as Api.Destination.Res.Availability;
			expect(destination.id).to.equal(localResource.availableDestinationId, 'bad destination ID returned');
			expect(destination.accommodations)
				.to.be.an('array')
				.with.length.greaterThan(0, 'no accommodations returned');

			const accommodation = destination.accommodations[0];
			expect(accommodation.prices, 'No prices returned').to.be.an('array').with.length.of.at.least(1);
			const price = accommodation.prices[0];
			expect(price.priceCents).to.be.greaterThan(0, 'invalid price');
			expect(price.rate, 'Invalid rate').to.be.an('object').with.ownProperty('code').that.is.a('string');

			const table = localResource.destinationTable;
			expect(table.getAvailableCalls).to.be.greaterThan(0, 'never got available from DB');
			expect(table.lastIdPassed).to.be.an('array').that.includes.members([localResource.availableDestinationId]);
		});
	});
	describe('Update destination', function () {
		beforeEach(initialize);
		it('should update the destination mock data model', async function () {
			const mockDestinations: Model.Destination = localResource.destinationTable.Destinations[0];
			const updatedMockDestination: Api.Destination.Res.Details = await destinationService.update(
				mockDestinations.id,
				{
					id: mockDestinations.id,
					...localResource.destinationUpdate
				},
				localResource.companyId
			);
			expect(updatedMockDestination).to.exist;
			expect(updatedMockDestination.description).to.equal(localResource.destinationUpdate.description);
		});
	});
	describe('Get Property Types', function () {
		it('should get property types', async function () {
			const result = await destinationService.getAllPropertyTypes();
			expect(result).to.exist;
			expect(result).to.be.an('array');
		});
		it('should get set property types for destination', async function () {
			const result = await destinationService.getPropertyTypes(localResource.availableDestinationId);
			expect(result).to.exist;
			expect(result).to.be.an('array');
		});
	});
});
