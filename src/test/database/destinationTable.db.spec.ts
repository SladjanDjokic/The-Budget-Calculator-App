import chai from 'chai';
import dbSingleton from '../../database/dbSingleton';
import resource from '../resources/destination.db.resource';
import IDestinationTable from '../../database/interfaces/IDestinationTable';
import Destination from '../../database/objects/destination.db';

const expect = chai.expect;

describe('Destination table', function () {
	let table: IDestinationTable;
	let directTable: Destination;
	before(() => {
		directTable = dbSingleton.get().destination;
		table = directTable;
	});

	describe('Query functions', function () {
		describe('Simple destination experiences', async function () {
			it('should get valid experiences by destination', async function () {
				const query = Destination['destinationExperienceSubquery'];
				const result = await directTable.db.runQuery(query);
				expect(result).to.be.an('array');
				for (let destination of result) {
					expect(destination.experiences).to.be.an('array');
					for (let experience of destination.experiences) {
						expect(experience.id, 'Invalid experience ID').to.be.greaterThan(0);
						expect(experience.title, 'Invalid experience title')
							.to.be.a('string')
							.with.length.greaterThan(0, 'No title supplied');
					}
				}
			});
		});
		describe('Detailed destinations', function () {
			it('should get valid destinations', async function () {
				const query = Destination['detailQuery'];
				const result = await directTable.db.runQuery(`${query} LIMIT 2;`);
				expect(result).to.be.an('array').with.lengthOf(2);
				for (const destination of result) {
					expect(destination.id).to.be.greaterThan(0, 'Invalid ID');
					expect(destination.externalId).to.be.a('string').with.lengthOf.at.least(1);
					expect(destination.name).to.be.a('string').with.length.greaterThan(0, 'No name supplied');
					expect(destination.media)
						.to.be.an('array', 'Invalid media')
						.with.lengthOf.at.least(1, 'No destination media');
					expect(destination.experiences).to.be.an('array', 'invalid experiences');
					expect(destination.packages).to.be.an('array', 'Invalid packages');
					expect(destination.accommodations)
						.to.be.an('array', 'Invalid accommodations')
						.with.length.greaterThan(0, 'No accommodations');
					expect(destination.accommodationTypes)
						.to.be.an('array', 'Invalid accommodation types')
						.with.length.greaterThan(0, 'No accommodation types');
					expect(destination.policies).to.be.an('array', 'Invalid policies');
					if (destination.experiences.length < 1) continue;
					for (let experience of destination.experiences) {
						expect(experience.id, 'Invalid experience ID').to.be.greaterThan(0);
						expect(experience.title, 'Invalid experience title')
							.to.be.a('string')
							.with.length.greaterThan(0, 'No title supplied');
					}
				}
			});
		});
	});

	describe('Get By Page', function () {
		it('should get results', async function () {
			const result = await table.getByPage(resource.pagination, resource.sort);
			const destinations = result.data;
			expect(destinations)
				.to.be.an('array', 'Invalid result')
				.with.lengthOf.at.least(1)
				.and.at.most(resource.pagination.perPage);
		});
	});

	describe('Get available', function () {
		it('should get destinations with available accommodations', async function () {
			const result = await table.getAvailable(resource.availableDestinationIds, resource.propertyTypeIds);
			expect(result, 'No response').to.exist.and.have.length.of.at.least(1, 'Empty response');
			expect(result[0].accommodations).to.have.length.of.at.least(1, 'Destination without accommodations');
		});
		it('should get valid destinations', async function () {
			const result = await table.getAvailable(resource.availableDestinationIds, resource.propertyTypeIds);
			for (let destination of result) {
				expect(destination.name, 'Invalid name').to.be.a('string').with.length.greaterThan(0);
				expect(destination.experiences)
					.to.be.an('array', 'Invalid feature list')
					.and.not.to.be.a('string', 'Feature list was not parsed');
			}
		});
		it('should get valid accommodations', async function () {
			const result = await table.getAvailable(resource.availableDestinationIds, resource.propertyTypeIds);
			for (let destination of result) {
				for (let accommodation of destination.accommodations) {
					expect(accommodation, 'No accommodation found').to.exist;
					expect(accommodation.id, 'Invalid accommodation ID').to.be.a('number').greaterThan(0);
					expect(accommodation.name, 'Invalid accommodation name')
						.to.be.a('string')
						.with.length.greaterThan(0);
					expect(accommodation.maxOccupantCount, 'Invalid Occupant Count').to.be.a('number').greaterThan(0);
					expect(accommodation.amenities)
						.to.be.an('array', 'Invalid feature list')
						.and.not.to.be.a('string', 'Feature list was not parsed');
					for (let amenity of accommodation.amenities) {
						expect(amenity.id, 'Invalid amenity ID').to.be.greaterThan(0);
						expect(amenity.icon, 'Invalid amenity icon').to.be.a('string').with.length.greaterThan(0);
						expect(amenity.title, 'Invalid amenity title').to.be.a('string').with.length.greaterThan(0);
					}
				}
			}
		});
	});

	describe('Update Destination', function () {
		let destinationToChange: Model.Destination;
		before(async () => {
			destinationToChange = await table.getById(resource.availableDestinationIds[0], resource.companyId);
		});
		it('should update the destination', async function () {
			const result = await table.update(
				resource.availableDestinationIds[0],
				resource.updatedDestination,
				resource.companyId
			);
			expect(result.locationDescription, 'Location Description updated').to.equal(
				resource.updatedDestination.locationDescription
			);
			expect(result.description, 'Description updated successfully').to.equal(
				resource.updatedDestination.description
			);
		});
		after(async () => {
			await table.update(
				resource.availableDestinationIds[0],
				{
					id: resource.availableDestinationIds[0],
					description: destinationToChange.description,
					locationDescription: destinationToChange.locationDescription
				},
				resource.companyId
			);
		});
	});

	describe('Get details', function () {
		it('should get the right destination', async function () {
			// This is mostly to ensure that the query function is integrated correctly
			const result = await table.getDestinationDetails(resource.destinationDetailId, resource.companyId);
			expect(result, 'No destination returned').to.exist;
			expect(result.id).to.equal(resource.destinationDetailId);
		});
	});
	describe('Get Property Types', function () {
		it('should get all property types', async function () {
			const result = await table.getAllPropertyTypes();
			expect(result).to.exist;
			expect(result).to.be.an('array');
			expect(result[0]).to.haveOwnProperty('id');
			expect(result[0]).to.haveOwnProperty('name');
		});
		it('should get destinations for specific destination', async function () {
			const result = await table.getPropertyTypes(resource.destinationDetailId);
			expect(result).to.exist;
			expect(result).to.be.an('array');
			expect(result[0]).to.haveOwnProperty('id');
			expect(result[0]).to.haveOwnProperty('name');
		});
	});
});
