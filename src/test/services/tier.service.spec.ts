import chai from 'chai';
import TierFeatureTableMock from '../../database/mocks/tierFeature.db.mock';
import TierService from '../../services/tier/tier.service';
import TierResource from '../resources/tier.service.resource';

describe('Tier Service', function () {
	let tierResource: TierResource;
	let tierService: TierService;
	function initialize() {
		tierResource = new TierResource();
		tierService = new TierService(tierResource.tierTable, tierResource.tierFeatureTable);
		tierService.start({ MediaService: tierResource.mediaService });
	}

	describe('Create Tier Features', function () {
		beforeEach(initialize);
		it('should create a new tier feature', async function () {
			const createdFeature: Model.TierFeature = await tierService.createFeature(tierResource.tierFeatureName);
			chai.expect(createdFeature).to.exist;
			chai.expect(createdFeature).to.haveOwnProperty('id');
			chai.expect(createdFeature.name).to.equal(tierResource.tierFeatureName);
		});
	});

	describe('Create a new tier', function () {
		beforeEach(initialize);
		it('should create a new user tier', async function () {
			const createObj = {
				...tierResource.tierCreate,
				featureIds: [tierResource.existingFeature.id]
			};
			let tier: Api.Tier.Res.Get = await tierService.create(createObj);
			chai.expect(tier.id).to.exist;
			chai.expect(tier).to.haveOwnProperty('name').that.equals(tierResource.tierCreate.name);
		});
		it('should add media map for the new tier', async () => {
			tierResource.tierCreate.mediaDetails = tierResource.mediaDetails;
			const submittedMediaIds: number[] = tierResource.mediaDetails.map((m) => m.id);
			const tier = await tierService.create(tierResource.tierCreate);
			chai.expect(tierResource.mediaService.createMediaMapAndSetMediaPropertyCalls).to.be.greaterThan(0);
			chai.expect(tierResource.mediaService.mediaIds).to.include.members(submittedMediaIds);
		});
		it('should create a feature map for the new tier');
	});

	describe('Update Tier', function () {
		beforeEach(initialize);
		it("should update a tier's feature", async function () {
			const result: Api.Tier.Res.Get = await tierService.update(tierResource.existingTier.id, {
				id: tierResource.existingTier.id,
				featureIds: [tierResource.existingFeature.id],
				name: tierResource.tierUpdate.name
			});
			chai.expect(result).to.exist;
			chai.expect(result.modifiedOn).to.not.equal(result.createdOn);
			chai.expect(result.features).to.be.an('array');
			chai.expect(result.name).to.equal(tierResource.tierUpdate.name);
		});
		it('should update a tierFeature', async function () {
			const result: Model.TierFeature = await tierService.updateFeature(tierResource.existingFeature.id, {
				name: `${tierResource.tierFeatureName} Update`
			});
			chai.expect(result).to.exist;
			chai.expect(result.name).to.not.equal(tierResource.existingFeature.name);
			chai.expect(result.modifiedOn).to.not.equal(tierResource.existingFeature.createdOn);
			chai.expect(tierResource.tierFeatureTable.features[tierResource.existingFeature.id]).to.eql(result);
		});
	});

	describe('Get tier', function () {
		beforeEach(initialize);
		it('should get a tier by its id', async function () {
			let tier: Api.Tier.Res.Get = await tierService.getById(tierResource.existingTier.id);
			chai.expect(tier).to.exist;
			chai.expect(tier.id).to.equal(tierResource.existingTier.id);
			chai.expect(tier.mediaDetails).to.exist;
			chai.expect(tier.mediaDetails).to.be.an('array');
		});
		it('should get tiers by page', async function () {
			let filterObj = {
				...tierResource.filter
			};
			filterObj.searchTerm[0].value = tierResource.existingTier.id;
			const tier: RedSky.RsPagedResponseData<Model.Tier> = await tierService.getByPage(
				tierResource.pagination,
				tierResource.sort,
				filterObj
			);
			chai.expect(tier.data).to.exist;
			chai.expect(tier.total).to.exist;
			chai.expect(tier.total).to.be.greaterThan(0);
			chai.expect(tier.data[tierResource.existingTier.id]).to.haveOwnProperty('id');
		});
	});

	describe('Tier Delete', function () {
		beforeEach(initialize);
		it('should delete a tier', async function () {
			const tierDeleted: number = await tierService.delete(tierResource.existingTier.id);
			chai.expect(tierDeleted).to.be.a('number');
			chai.expect(tierDeleted).to.equal(tierResource.existingTier.id);
		});
		it('should delete a tier Feature', async function () {
			const tierDeleted: number = await tierService.deleteFeature(tierResource.existingFeature.id);
			chai.expect(tierDeleted).to.be.a('number');
			chai.expect(tierDeleted).to.equal(tierResource.existingFeature.id);
		});
	});
});
