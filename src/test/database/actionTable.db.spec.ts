import chai from 'chai';
import dbSingleton from '../../database/dbSingleton';
import resource from '../resources/action.db.resource';
import ActionTable from '../../database/objects/action.db';

const expect = chai.expect;

describe('Action table', function () {
	let table: ActionTable;
	before(() => {
		table = dbSingleton.get().action;
	});

	describe('Create', function () {
		it('should create an action with brand', async function () {
			resource.createActionRequest.brandId = resource.brandId;
			const result: Api.Action.Res.Get = await table.create(resource.createActionRequest);
			expect(result, 'No result returned').to.exist;
			expect(result.brand).to.exist;
			expect(result.brand.name).to.be.a('string').with.length.at.least(1);
			expect(result.brandLocation).to.be.null;
			after(async () => {
				await table.delete(result.id);
			});
		});
		it('should create an action without brand', async function () {
			delete resource.createActionRequest.brandId;
			const result: Api.Action.Res.Get = await table.create(resource.createActionRequest);
			expect(result, 'No result returned').to.exist;
			expect(result.brand).to.be.null;
			resource.actionWithoutBrandId = result.id;
			after(async () => {
				await table.delete(result.id);
			});
		});
		it('should create an action with brand location', async function () {
			resource.createActionRequest.brandId = resource.brandId;
			resource.createActionRequest.brandLocationId = resource.brandLocationId;
			const result: Api.Action.Res.Get = await table.create(resource.createActionRequest);
			expect(result, 'No result returned').to.exist;
			expect(result.brand).to.exist;
			expect(result.brand.name).to.be.a('string').with.length.at.least(1);
			expect(result.brandLocation).to.exist;
			expect(result.brandLocation.address1).to.be.a('string').with.length.at.least(1);
			resource.actionWithBrandId = result.id;
			after(async () => {
				await table.delete(result.id);
			});
		});
	});

	describe('Query functions', function () {
		describe('Get by ID with brand', async function () {
			let action: Api.Action.Res.Get;
			it('should get valid action', async function () {
				action = await table.getById(resource.actionWithBrandId);

				expect(action, 'No result returned').to.exist;
				expect(action.id).to.equal(resource.actionWithBrandId);
				expect(action.name).to.be.a('string').with.length.at.least(1);
			});
			it('should get the related brand', async function () {
				if (!!!action) this.skip();

				expect(action.brand, 'No brand returned').to.exist.and.be.an('object', 'Brand was not parsed');
				const brand = action.brand;
				expect(brand.name, 'No name').to.exist.and.be.a('string').with.length.at.least(1);
				expect(brand.createdOn, 'No creation date').to.exist;
			});
			it('should get the related brand location', async function () {
				if (!!!action) this.skip();

				expect(action.brandLocation, 'No brand location returned').to.exist.and.be.an(
					'object',
					'brand location was not parsed'
				);
				const location = action.brandLocation;
				expect(location.name, 'Name not found').to.exist.and.be.a('string');
				expect(location.address1, 'Address1 not found').to.exist.and.be.a('string').with.length.at.least(1);
				expect(location.address2, 'Address2 not found').to.exist.and.be.a('string');
				expect(location.city, 'City not found').to.exist.and.be.a('string').with.length.at.least(1);
				expect(location.state, 'State not found').to.exist.and.be.a('string').with.length.at.least(2);
				expect(location.country, 'Country not found').to.exist.and.be.a('string');
				expect(location.zip, 'ZIP not found').to.exist.and.be.a('string').with.length.at.least(5);
				expect(location.externalId, 'External ID not found').to.exist.and.be.a('string');
			});
		});
		describe('Get by ID without brand', function () {
			it('should get an action without an brand', async function () {
				const result = await table.getById(resource.actionWithoutBrandId);
				expect(result, 'No result returned').to.exist;
				expect(result.brand).to.be.null;
			});
		});
	});

	describe('Update', function () {
		beforeEach(() => {
			resource.updateRequest = { id: resource.actionWithoutBrandId };
		});
		it('should update the right record', async function () {
			resource.updateRequest.description = `Testing ${new Date().getTime()}`;
			const result = await table.update(resource.updateRequest.id, resource.updateRequest, resource.companyId);
			expect(result, 'No result returned').to.exist;
			expect(result.description).to.equal(resource.updateRequest.description);
		});
		it('should associate a brand', async function () {
			resource.updateRequest.brandId = resource.brandId;
			const result = await table.update(resource.updateRequest.id, resource.updateRequest, resource.companyId);
			expect(result, 'No result returned').to.exist;
			expect(result.brand, 'No brand returned').to.exist;
			expect(result.brand.id, 'brand ID did not match').to.equal(resource.brandId);
		});
		it('should remove a brand', async function () {
			resource.updateRequest.brandId = null;
			const result = await table.update(resource.updateRequest.id, resource.updateRequest, resource.companyId);
			expect(result, 'No result returned').to.exist;
			expect(result.brand, 'Incorrect brand returned').to.be.null;
		});
	});
});
