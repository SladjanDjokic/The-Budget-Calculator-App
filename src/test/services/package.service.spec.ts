import chai from 'chai';
import serviceFactory from '../../services/serviceFactory';
import UpsellPackageService from '../../services/packages/packages.service';
import packageResource from '../resources/package.service.resource';
import MediaService from '../../services/media/media.service';
import reservationResource from '../resources/reservation.service.resource';
const expect = chai.expect;

describe('PackageService', function () {
	let upsellPackageService: UpsellPackageService;
	let mediaService: MediaService;
	let packageFromDb: Api.UpsellPackage.Details;
	before(async function () {
		await packageResource.refreshCache();
		upsellPackageService = new UpsellPackageService(
			packageResource.upsellPackageTable,
			packageResource.redis,
			packageResource.reservationSystemProvider
		);
		upsellPackageService.start({
			MediaService: packageResource.mediaService
		});
		mediaService = serviceFactory.get<MediaService>('MediaService');
	});

	describe('Get a package', function () {
		it('should get packages by page', async function () {
			const packagesByPage: RedSky.RsPagedResponseData<
				Api.UpsellPackage.Res.Get[]
			> = await upsellPackageService.getByPage(
				packageResource.pagination,
				packageResource.sort,
				packageResource.filter,
				packageResource.companyId
			);
			expect(packagesByPage).to.exist;
			expect(packagesByPage.data).to.exist;
			expect(packagesByPage.data).to.be.an('array');
			expect(packagesByPage.total).to.exist;
			expect(packagesByPage.total).to.be.a('number');
			expect(packagesByPage.data[0]).to.haveOwnProperty('id');
			expect(packagesByPage.data[0]).to.haveOwnProperty('title');
			expect(packagesByPage.data[0]).to.haveOwnProperty('description');
			expect(packagesByPage.data[0]).to.haveOwnProperty('code');
			expect(packagesByPage.data[0].media).to.be.an('array');
			packageFromDb = packagesByPage.data[0];
		});
		it('should get a package and details', async function () {
			if (!!!packageFromDb) this.skip();
			const packageDetails: Api.UpsellPackage.Details = await upsellPackageService.getById(
				packageFromDb.id,
				packageResource.companyId
			);
			chai.expect(packageDetails).to.exist;
			chai.expect(packageDetails.media).to.be.an('array');
			chai.expect(packageDetails).to.haveOwnProperty('title');
			chai.expect(packageDetails).to.haveOwnProperty('description');
			chai.expect(packageDetails).to.haveOwnProperty('code');
		});
		it('should get many packages and details by ids', async function () {
			if (!!!packageFromDb) this.skip();
			const companyMediaList = await mediaService['getForCompany'](packageResource.companyId);
			const idsList = [packageFromDb.id];
			for (let i = 0; i < 4; i++) {
				idsList.push(companyMediaList[i].id);
			}
			const packageDetails: Api.UpsellPackage.Details[] = await upsellPackageService.getManyByIds(
				idsList,
				packageResource.companyId
			);
			chai.expect(packageDetails).to.exist;
			chai.expect(packageDetails.length).to.lessThan(idsList.length + 1);
			for (let packages of packageDetails) {
				chai.expect(idsList).to.include(packages.id);
			}
		});
	});

	describe('Update a package', function () {
		before(function () {
			if (!!!packageFromDb) this.skip();
		});
		it('should update a package and details', async function () {
			const packageDetails: Api.UpsellPackage.Details = await upsellPackageService.update(
				{
					id: packageFromDb.id,
					...packageResource.packageUpdate
				},
				packageResource.companyId
			);
			chai.expect(packageDetails).to.exist;
			chai.expect(packageDetails.media).to.be.an('array');
			chai.expect(packageDetails).to.haveOwnProperty('title').that.equals(packageFromDb.title);
			chai.expect(packageDetails).to.haveOwnProperty('description');
			chai.expect(packageDetails)
				.to.haveOwnProperty('isActive')
				.that.equals(packageResource.packageUpdate.isActive);
		});
	});

	describe('Get available', function () {
		let availabilityResults;
		it('should get availability results from cache', async function () {
			const result = await upsellPackageService.getAvailable(
				packageResource.availabilityRequest,
				packageResource.companyId
			);
			expect(result).to.exist;
			expect(result.data).to.be.an('array').with.lengthOf(1);
			expect(packageResource.redis.getManyCalls).to.be.greaterThan(0);
			const upsellPackage = result.data[0];
			expect(upsellPackage).to.haveOwnProperty('id').that.equals(packageResource.existingUpsellPackage.id);
			expect(upsellPackage).to.haveOwnProperty('title');
		});
	});

	describe('Sync a package block', function () {
		before(async function () {
			reservationResource.redisClient.reset();
			await reservationResource.redisClient.set(
				reservationResource.availabilityKey,
				reservationResource.availableAccommodations
			);
		});
		it('should pull back synchronized data for the given block', async function () {
			const upsellPackageBlock = await upsellPackageService.syncPackageBlock(
				packageResource.companyId,
				packageResource.availabilityKey
			);
			chai.expect(upsellPackageBlock).to.exist;
			chai.expect(upsellPackageBlock[packageResource.upsellPackageKey], 'Missing block').to.exist;
			chai.expect(upsellPackageBlock[packageResource.upsellPackageKey])
				.to.have.own.property('destinationId')
				.that.equals(packageResource.destinationId);
			chai.expect(upsellPackageBlock[packageResource.upsellPackageKey])
				.to.have.own.property('upsellPackages')
				.that.is.an('array', 'invalid upsell package list');
			chai.expect(reservationResource.redisClient.values[reservationResource.upsellPackageKey]).to.eql(
				JSON.stringify(upsellPackageBlock[reservationResource.upsellPackageKey]),
				'package lists do not match'
			);
		});
	});
});
