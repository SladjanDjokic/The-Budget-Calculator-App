import chai from 'chai';
import dbSingleton from '../../database/dbSingleton';
import resource from '../resources/accommodationLayout.db.resource';
import AccommodationLayoutTable from '../../database/objects/accommodationLayout.db';

const expect = chai.expect;

describe('AccommodationLayout table', function () {
	let table: AccommodationLayoutTable;
	before(() => {
		table = dbSingleton.get().accommodationLayout;
	});
	describe('Get by ID', function () {
		let layout: Api.AccommodationLayout.Details;
		it('should get the detailed object', async function () {
			const result = await table.getById(resource.layoutId);
			expect(result).to.exist;
			expect(result.id).to.equal(resource.layoutId);
			expect(result.title).to.be.a('string').that.is.not.empty;
			layout = result;
		});
		it('should get the layout image', function () {
			if (!!!layout) this.skip();
			expect(layout.media, 'invalid media object').to.exist.and.to.be.an('object');
			expect(!!layout.media.isPrimary, 'wrong image').to.be.true;
			expect(layout.media, 'no title').to.haveOwnProperty('title');
			expect(layout.media, 'no description').haveOwnProperty('description');
			expect(layout.media, 'no urls').to.haveOwnProperty('urls').that.is.an('object').that.is.not.empty;
		});
		it('should get the layout rooms', function () {
			if (!!!layout) this.skip();
			expect(layout.rooms).to.exist.and.be.an('array').that.is.not.empty;
			const room = layout.rooms[0];
			expect(room.title).to.be.a('string').that.is.not.empty;
		});
	});
	describe('Get many by IDs', function () {
		let manyLayouts: Api.AccommodationLayout.Details[];
		it('should get the detailed objects', async function () {
			const result = await table.getManyByIds(resource.manyLayoutIds);
			expect(result).to.exist;
			expect(result.length).to.equal(resource.manyLayoutIds.length);
			for (const layout of result) {
				expect(resource.manyLayoutIds).to.include(layout.id);
				expect(layout.title).to.be.a('string').that.is.not.empty;
			}
			manyLayouts = result;
		});
		it('should get the layout images', function () {
			if (!!!manyLayouts) this.skip();
			for (const layout of manyLayouts) {
				expect(layout.media, 'invalid media object').to.exist.and.to.be.an('object');
				expect(!!layout.media.isPrimary, 'wrong image').to.be.true;
				expect(layout.media, 'no title').to.haveOwnProperty('title');
				expect(layout.media, 'no description').haveOwnProperty('description');
				expect(layout.media, 'no urls').to.haveOwnProperty('urls').that.is.an('object').that.is.not.empty;
			}
		});
		it('should get the layout rooms', function () {
			if (!!!manyLayouts) this.skip();
			for (const layout of manyLayouts) {
				expect(layout.rooms).to.exist.and.be.an('array');
				if (!!!layout.rooms.length) continue;
				const room = layout.rooms[0];
				expect(room.title).to.be.a('string').that.is.not.empty;
			}
		});
	});
	describe('Get by page', function () {
		let pagedLayouts: Api.AccommodationLayout.Details[];
		it('should get the detailed objects', async function () {
			const result = await table.getByPage(resource.pagination, resource.sort, resource.filter);
			expect(result).to.exist;
			expect(result.data.length).to.be.at.most(resource.pagination.perPage);
			expect(result.data.length).to.be.at.most(result.total);
			for (const layout of result.data) {
				expect(layout.title).to.be.a('string').that.is.not.empty;
			}
			pagedLayouts = result.data;
		});
		it('should get the layout images', function () {
			if (!!!pagedLayouts) this.skip();
			for (const layout of pagedLayouts) {
				expect(layout.media, 'invalid media object').to.exist.and.to.be.an('object');
				expect(!!layout.media.isPrimary, 'wrong image').to.be.true;
				expect(layout.media, 'no title').to.haveOwnProperty('title');
				expect(layout.media, 'no description').haveOwnProperty('description');
				expect(layout.media, 'no urls').to.haveOwnProperty('urls').that.is.an('object').that.is.not.empty;
			}
		});
		it('should get the layout rooms', function () {
			if (!!!pagedLayouts) this.skip();
			for (const layout of pagedLayouts) {
				expect(layout.rooms).to.exist.and.be.an('array');
				if (!!!layout.rooms.length) continue;
				const room = layout.rooms[0];
				expect(room.title).to.be.a('string').that.is.not.empty;
			}
		});
	});
});
