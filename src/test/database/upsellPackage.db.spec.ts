import chai from 'chai';
import IUpsellPackageTable from '../../database/interfaces/IUpsellPackageTable';
import resource from '../resources/packageTable.db.resource';
import dbSingleton from '../../database/dbSingleton';
const expect = chai.expect;

describe('Package table', function () {
	let table: IUpsellPackageTable;
	let createdPackageId: number;

	before(() => {
		table = dbSingleton.get().upsellPackage;
	});
	after(async function () {
		if (!!createdPackageId) dbSingleton.get().upsellPackage.deleteForTestOnly(createdPackageId);
	});

	describe('Create', () => {
		it('should create a new package', async function () {
			const result = await table.create(resource.createRequest, resource.companyId);
			expect(result, 'Nothing returned').to.exist;
			expect(result.id, 'Invalid ID').to.be.a('number').greaterThan(0);
			expect(result.companyId)
				.to.be.a('number', 'Invalid company ID')
				.that.equals(resource.companyId, 'Incorrect company ID');
			expect(result.title).to.equal(resource.createRequest.title);
			expect(result.description).to.equal(resource.createRequest.description);
			createdPackageId = result.id;
		});
	});
	describe('Get by ID', () => {
		before(function () {
			if (!!!createdPackageId) this.skip();
		});
		it('should get the package details', async function () {
			const result = await table.getById(createdPackageId);
			expect(result, 'Nothing returned').to.exist;
			expect(result.title, 'No title').to.be.a('string').with.length.of.at.least(1);
			expect(result.description, 'No description').to.be.a('string').with.length.of.at.least(1);
			expect(result.media)
				.to.be.an('array', 'Invalid media property')
				.with.lengthOf(1, "Returned someone else's media");
			expect(result.media[0]).to.haveOwnProperty('description');
			expect(result.media[0]).to.haveOwnProperty('description').and.be.a('string');
			expect(result.media[0]).to.haveOwnProperty('id').and.be.a('number');
			expect(result.media[0]).to.haveOwnProperty('isPrimary').and.be.a('number');
			expect(result.media[0]).to.haveOwnProperty('title').and.be.a('string');
			expect(result.media[0]).to.haveOwnProperty('type').and.be.a('string');
			expect(result.media[0]).to.haveOwnProperty('urls').and.be.an('object');
			expect(result.media[0].urls)
				.to.haveOwnProperty('thumb')
				.and.be.an('string')
				.and.equal('https://ik.imagekit.io/redsky/spire/noImageFound.png');
			expect(result.media[0].urls)
				.to.haveOwnProperty('small')
				.and.be.an('string')
				.and.equal('https://ik.imagekit.io/redsky/spire/noImageFound.png');
			expect(result.media[0].urls)
				.to.haveOwnProperty('large')
				.and.be.an('string')
				.and.equal('https://ik.imagekit.io/redsky/spire/noImageFound.png');
			expect(result.media[0].urls)
				.to.haveOwnProperty('imageKit')
				.and.be.an('string')
				.and.equal('https://ik.imagekit.io/redsky/spire/noImageFound.png');
			expect(result.isActive, 'Package inactive').to.equal(1);
		});
	});
	describe('Get by company', function () {
		before(function () {
			if (!!!createdPackageId) this.skip();
		});
		it('should get packages', async function () {
			const result = await table.getByCompany(resource.companyId);
			expect(result, 'Nothing returned').to.exist;
			expect(result, 'Empty result').to.be.an('array').with.length.of.at.least(1);
			const newPackage = result.find((p) => p.id === createdPackageId);
			expect(newPackage, 'New package was not in company results').to.exist;
		});
	});
	describe('Update', () => {
		before(function () {
			if (!!!createdPackageId) this.skip();
		});
		it('should deactivate the package', async function () {
			const result = await table.update(createdPackageId, resource.updateRequest, resource.companyId);
			expect(result, 'Nothing returned').to.exist;
			expect(result.id, 'Wrong ID').to.equal(createdPackageId);
			expect(result.title, 'Wrong title').to.equal(resource.createRequest.title);
			expect(result.description, 'Wrong description').to.equal(resource.createRequest.description);
			expect(result.isActive, 'Not deactivated').to.equal(0);
		});
	});
});
