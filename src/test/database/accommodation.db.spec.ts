import chai from 'chai';
import dbSingleton from '../../database/dbSingleton';
import resource from '../resources/accommodation.db.resource';
import AccommodationTable from '../../database/objects/accommodation.db';

const expect = chai.expect;

describe('Accommodation table', function () {
	let table: AccommodationTable;
	before(() => {
		table = dbSingleton.get().accommodation;
	});
	describe('Subqueries', function () {
		it('should get accommodation and category media', async function () {
			const limit: number = 10;
			let result: Api.Media[];
			try {
				result = await table.db.runQuery(`${AccommodationTable.accommodationMediaSubquery} LIMIT ${limit};`);
			} catch {
				chai.assert(false, 'Media query failed');
			}
			expect(result).to.be.an('array').with.lengthOf(limit);
		});
	});
	describe('Get details', function () {
		let accommodation: Api.Accommodation.Res.Details;

		it('should get the accommodation', async function () {
			const result = await table.getAccommodationDetails(resource.accommodationId);
			expect(result).to.exist;
			expect(result.id).to.equal(resource.accommodationId);
			expect(result.name).to.be.a('string').that.is.not.empty;
			expect(result.amenities).to.be.an('array');
			expect(result.categories).to.be.an('array');
			accommodation = result;
		});
		it('should include media', function () {
			const media = accommodation.media;
			expect(media)
				.to.exist.and.be.an('array', 'invalid media property')
				.with.lengthOf.at.least(1, 'No media in array');
			for (const item of media) {
				expect(item, 'invalid media object').to.exist.and.to.be.an('object');
				expect(item, 'no title').to.haveOwnProperty('title');
				expect(item, 'no description').haveOwnProperty('description');
				expect(item, 'no urls').to.haveOwnProperty('urls').that.is.an('object').that.is.not.empty;
			}
		});
		describe('Accommodation detail layouts', function () {
			let manyLayouts: Api.AccommodationLayout.Details[];
			before(function () {
				if (!!!accommodation) {
					this.skip;
				}
			});
			it('should get the layouts', function () {
				manyLayouts = accommodation.layout;
				expect(manyLayouts).to.exist;
				expect(manyLayouts.length).to.be.at.least(1);
			});
			it('should get the layout images', function () {
				for (const layout of manyLayouts) {
					expect(layout.media, 'invalid media object').to.exist.and.to.be.an('object');
					expect(layout.media, 'no title').to.haveOwnProperty('title');
					expect(layout.media, 'no description').haveOwnProperty('description');
					expect(layout.media, 'no urls').to.haveOwnProperty('urls').that.is.an('object').that.is.not.empty;
				}
			});
			it('should get the layout rooms', function () {
				for (const layout of manyLayouts) {
					expect(layout.rooms).to.exist.and.be.an('array');
					if (!!!layout.rooms.length) continue;
					const room = layout.rooms[0];
					expect(room.title).to.be.a('string').that.is.not.empty;
				}
			});
		});
	});
	describe('Get by page', function () {
		let pagedAccommodations: Api.Accommodation.Res.Details[];

		it('should get the accommodations', async function () {
			const result = await table.getByPage(resource.pagination, resource.sort, resource.filter);
			expect(result).to.exist;
			expect(result.data.length).to.be.at.most(resource.pagination.perPage);
			expect(result.data.length).to.be.at.most(result.total);
			pagedAccommodations = result.data;
		});
		it('should include media', function () {
			if (!!!pagedAccommodations) this.skip();
			for (const accommodation of pagedAccommodations) {
				const media = accommodation.media;
				expect(media).to.exist.and.be.an('array');
				for (const item of media) {
					expect(item, 'invalid media object').to.exist.and.to.be.an('object');
					expect(item, 'no title').to.haveOwnProperty('title');
					expect(item, 'no description').haveOwnProperty('description');
					expect(item, 'no urls').to.haveOwnProperty('urls').that.is.an('object').that.is.not.empty;
				}
			}
		});
		describe('Accommodation detail layouts', function () {
			before(function () {
				if (!!!pagedAccommodations) {
					this.skip;
				}
			});
			it('should get the layouts', function () {
				for (const accommodation of pagedAccommodations) {
					expect(accommodation.layout).to.exist;
				}
			});
			it('should get the layout images', function () {
				for (const accommodation of pagedAccommodations) {
					for (const layout of accommodation.layout) {
						expect(layout.media, 'invalid media object').to.exist.and.to.be.an('object');
						expect(layout.media, 'no title').to.haveOwnProperty('title');
						expect(layout.media, 'no description').haveOwnProperty('description');
						expect(layout.media, 'no urls').to.haveOwnProperty('urls').that.is.an('object').that.is.not
							.empty;
					}
				}
			});
			it('should get the layout rooms', function () {
				for (const accommodation of pagedAccommodations) {
					for (const layout of accommodation.layout) {
						expect(layout.rooms).to.exist.and.be.an('array');
						if (!!!layout.rooms.length) continue;
						const room = layout.rooms[0];
						expect(room.title).to.be.a('string').that.is.not.empty;
					}
				}
			});
		});
	});
});
