import chai from 'chai';
import RewardService from '../../services/reward/reward.service';
import RewardServiceResource from '../resources/reward.service.resource';
import dbSingleton from '../../database/dbSingleton';
import MediaServiceMock from '../../services/media/media.service.mock';
const expect = chai.expect;
type RewardEssentials = Pick<Model.Reward, Extract<keyof Api.Reward.Res.Get, keyof Model.Reward>>;

describe('Reward Service', () => {
	let localResource: RewardServiceResource;
	let rewardService: RewardService;

	function initialize() {
		localResource = new RewardServiceResource();
		rewardService = localResource.services['RewardService'] as RewardService;
	}

	describe('Get rewards', () => {
		beforeEach(initialize);
		const liveRewardIdToFind = 1;
		it('should get rewards by page', async function () {
			const liveRewardTable = dbSingleton.get().reward;
			rewardService = new RewardService(
				liveRewardTable,
				localResource.categoryTable,
				localResource.rewardCategoryMapTable,
				localResource.rewardVoucherTable
			);
			rewardService.start(localResource.services);
			const rewardToFind = await liveRewardTable.getById(liveRewardIdToFind, localResource.companyId);

			let filterObj = {
				...localResource.filter
			};
			filterObj.searchTerm[0].value = rewardToFind.id;
			const pagedRewards: RedSky.RsPagedResponseData<Api.Reward.Res.Get[]> = await rewardService.getByPage(
				{ pagination: localResource.pagination, sort: localResource.sort, filter: filterObj },
				localResource.companyId
			);
			expect(pagedRewards).to.have.property('data');
			expect(pagedRewards).to.have.property('total');
			expect(pagedRewards.data).to.be.an('array');
			expect(pagedRewards.total).to.be.greaterThan(0);
			expect(pagedRewards.data[0]).to.haveOwnProperty('id');
			expect(pagedRewards.data[0].id).to.equal(rewardToFind.id);
		});
	});

	describe('Create reward', () => {
		beforeEach(initialize);
		it('should create a new reward', async () => {
			const result: Api.Reward.Res.Create = await rewardService.create(
				localResource.newReward,
				localResource.companyId
			);
			expect(result).to.exist;
			expect(result.id).to.be.greaterThan(0);
			expect(result.name).to.equal(localResource.newReward.name);
		});
		it('should save media for a new reward', async () => {
			const submittedMediaIds: number[] = localResource.newReward.mediaDetails.map((m) => m.id);
			const mediaService = localResource.services['MediaService'] as MediaServiceMock;
			await rewardService.create(localResource.newReward, localResource.companyId);
			expect(mediaService.getCreateMediaMapAndSetMediaPropertyCalls()).to.be.greaterThan(0);
			expect(mediaService.getMediaIds()).to.include.members(submittedMediaIds);
		});
		it('should assign the reward to the right categories', async () => {
			const submittedCategoryIds = localResource.newReward.categoryIds;
			const result: Api.Reward.Res.Create = await rewardService.create(
				localResource.newReward,
				localResource.companyId
			);
			expect(localResource.rewardCategoryMapTable.createCalls).to.be.greaterThan(0);
			expect(result.categoryIds).to.be.deep.members(submittedCategoryIds);
		});
	});
	describe('Update reward', () => {
		beforeEach(initialize);
		it('should update an existing reward', async () => {
			const rewardToUpdate: Model.Reward = localResource.rewardTable.Rewards[0];
			const newDescription = rewardToUpdate.description + 'testesttest';
			const result: Api.Reward.Res.Update = await rewardService.update(
				{ id: rewardToUpdate.id, description: newDescription },
				localResource.companyId
			);
			const savedReward = await localResource.rewardTable.getById(rewardToUpdate.id, localResource.companyId);
			expect(result, `no return`).to.exist;
			expect(result.description, `return didn't match`).to.eql(newDescription);
			expect(savedReward, `retrieval failure`).to.exist;
			expect(result, `update was not saved`).to.eql(savedReward);
		});
		it('should update category maps for existing reward', async () => {
			const existingCategoryMap = localResource.rewardCategoryMapTable.Maps[0];
			const rewardToUpdate = await localResource.rewardTable.getById(
				existingCategoryMap.rewardId,
				localResource.companyId
			);
			const submittedCategoryId: number = rewardToUpdate.categoryIds[0] + 1;
			const result: Api.Reward.Res.Update = await rewardService.update(
				{
					id: rewardToUpdate.id,
					categoryIds: [submittedCategoryId]
				},
				localResource.companyId
			);
			expect(result, `no return`).to.exist;
			const newCategoryMap = localResource.rewardCategoryMapTable.Maps.find(
				(m) => m.categoryId === submittedCategoryId
			);
			expect(newCategoryMap, `new map not created`).to.exist;
			const oldCategoryMap = localResource.rewardCategoryMapTable.Maps.find(
				(m) => m.categoryId === existingCategoryMap.categoryId
			);
			expect(oldCategoryMap, `old map still exists`).not.to.exist;
			expect(result.categoryIds, `return did not include proper category`).to.be.members([submittedCategoryId]);
		});
		it('should update media maps for existing reward', async () => {
			const firstRewardId = localResource.rewardTable.Rewards[0].id;
			const rewardToUpdate = await localResource.rewardTable.getById(firstRewardId, localResource.companyId);

			const updatedMedia: Api.MediaDetails[] = localResource.newMediaIds.map((id) => {
				return { id, isPrimary: 0 };
			});
			updatedMedia[0].isPrimary = 1;

			await rewardService.update(
				{
					id: rewardToUpdate.id,
					mediaDetails: updatedMedia
				},
				localResource.companyId
			);
			expect((localResource.services['MediaService'] as MediaServiceMock).getMediaIds()).to.have.members(
				localResource.newMediaIds
			);
		});
	});
	describe('Deactivate reward', () => {
		it('should deactivate a reward', async () => {
			const rewardToDeactivate: Model.Reward = localResource.rewardTable.Rewards.find(
				(p) => p.companyId === localResource.companyId && p.isActive
			);
			const result: number = await rewardService.deactivate(rewardToDeactivate.id, localResource.companyId);
			expect(result).to.be.greaterThan(0);
			const deactivatedreward = localResource.rewardTable.Rewards.find((p) => p.id === result);
			expect(deactivatedreward.isActive).to.equal(0);
		});
	});
	describe('Categories', () => {
		describe('Get reward categories', () => {
			beforeEach(initialize);
			const liveCategoryIdToFind = 1;
			it('should get reward categories by page', async () => {
				const pagedCategories: RedSky.RsPagedResponseData<
					Api.Reward.Category.Res.Get[]
				> = await rewardService.getCategoriesByPage(
					{ pagination: localResource.pagination, sort: localResource.sort, filter: localResource.filter },
					localResource.companyId
				);
				expect(pagedCategories).to.have.property('data');
				expect(pagedCategories).to.have.property('total');
				expect(pagedCategories.data).to.be.an('array');
				expect(pagedCategories.total).to.be.greaterThan(0);
				expect(pagedCategories.data[0]).to.haveOwnProperty('id');
				expect(pagedCategories.data[0]).to.haveOwnProperty('media').that.is.an('array');
			});
		});
		describe('Create a reward category', () => {
			beforeEach(initialize);
			it('should create a new category, save it, and return it', async () => {
				const result: Api.Reward.Category.Res.Create = await rewardService.createCategory(
					localResource.newCategory
				);
				expect(result).to.exist;
				expect(result.name).to.equal(localResource.newCategory.name);
				expect(result.id).to.be.greaterThan(0);
				expect(localResource.categoryTable.Categories.pop()).to.eql(result);
			});
			it('should save media for a new category', async () => {
				const submittedMediaIds: number[] = localResource.newCategory.mediaDetails.map((m) => m.id);
				const mediaService = localResource.services['MediaService'] as MediaServiceMock;
				const result = (await rewardService.createCategory(
					localResource.newCategory
				)) as Api.Reward.Category.Res.Create;
				expect(mediaService.getCreateMediaMapAndSetMediaPropertyCalls()).to.be.greaterThan(0);
				expect(mediaService.getMediaIds()).to.include.members(submittedMediaIds);
			});
		});
		it('should update media maps for existing category', async () => {
			const categoryToUpdate = localResource.categoryTable.Categories[0];
			const updatedMedia: Api.MediaDetails[] = localResource.newMediaIds.map((id) => {
				return { id, isPrimary: 0 };
			});
			updatedMedia[0].isPrimary = 1;

			await rewardService.updateCategory({
				mediaDetails: updatedMedia,
				...categoryToUpdate
			});
			expect((localResource.services['MediaService'] as MediaServiceMock).getMediaIds()).to.have.members(
				localResource.newMediaIds
			);
		});
		describe('Deactivate a reward category', () => {
			beforeEach(initialize);
			it('should deactivate a category', async () => {
				const categoryToDeactivate: Model.RewardCategory = localResource.categoryTable.Categories.find(
					(c) => c.name === 'Unassigned Stuff'
				);
				const result: number = await rewardService.deactivateCategory(categoryToDeactivate.id);
				expect(result).to.equal(categoryToDeactivate.id);
				const categoryInTable = await localResource.categoryTable.getById(categoryToDeactivate.id);
				expect(categoryInTable.isActive).to.equal(0);
			});
		});
	});
	describe('Get specific reward', () => {
		it('should get a single reward', async () => {
			const rewardToGet: RewardEssentials = localResource.rewardTable.Rewards.find(
				(p) => p.companyId === localResource.companyId
			);
			const result = await rewardService.getById(rewardToGet.id, localResource.companyId);
			expect(result).to.exist;
			expect(result.id).to.eql(rewardToGet.id);
			expect(result.name).to.eql(rewardToGet.name);
			expect(result.upc).to.eql(rewardToGet.upc);
		});
		it("should only get that company's rewards", async () => {
			const rewardToGet: RewardEssentials = localResource.rewardTable.Rewards.find(
				(p) => p.companyId === localResource.otherCompanyId
			);
			const result = await rewardService.getById(rewardToGet.id, localResource.companyId);
			expect(result).not.to.exist;
		});
	});
	describe('Get multiple specific rewards', () => {
		it('should get rewards', async () => {
			const rewardsToGet: RewardEssentials[] = localResource.rewardTable.Rewards.filter(
				(p) => p.companyId === localResource.companyId
			);
			const idsToGet: readonly number[] = rewardsToGet.map((p) => p.id);
			const result = await rewardService.getManyByIds(idsToGet, localResource.companyId);
			expect(result).to.exist;
			expect(result).to.eql(rewardsToGet);
		});
		it("should only get that company's rewards", async () => {
			const rewardsToGet: RewardEssentials[] = localResource.rewardTable.Rewards.filter(
				(p) => p.companyId === localResource.otherCompanyId
			);
			const idsToGet: readonly number[] = rewardsToGet.map((p) => p.id);
			const result = await rewardService.getManyByIds(idsToGet, localResource.companyId);
			expect(result.length).to.equal(0);
		});
	});
	describe('Vouchers', () => {
		it('should create new vouchers', async () => {
			const rewardToUpdate = localResource.rewardTable.Rewards[0];
			const result = await rewardService.createVouchers(
				{ codes: localResource.newVoucherCodes, rewardId: rewardToUpdate.id },
				rewardToUpdate.companyId
			);
			expect(result).to.be.an('array').with.length(localResource.newVoucherCodes.length);
			expect(localResource.rewardVoucherTable.Vouchers).to.deep.include.members(result);
		});
		it('should mark a voucher inactive', async () => {
			const request: Api.Reward.Voucher.Req.Delete = {
				rewardId: localResource.existingVoucher.rewardId,
				code: localResource.existingVoucher.code
			};
			const result: Api.Reward.Voucher.Res.Delete = await rewardService.deactivateVoucher(
				request,
				localResource.companyId
			);
			expect(result).to.haveOwnProperty('rewardId', localResource.existingVoucher.rewardId);
			expect(result).to.haveOwnProperty('code', localResource.existingVoucher.code);
			expect(localResource.existingVoucher.isActive).to.equal(0);
		});
		it('should get vouchers by page', async () => {
			const result: RedSky.RsPagedResponseData<
				Api.Reward.Voucher.Res.Get[]
			> = await rewardService.getVouchersByPage(
				{ pagination: localResource.pagination, sort: localResource.sort, filter: localResource.filter },
				localResource.companyId
			);
			expect(result?.data).to.exist;
			expect(result.total).to.equal(localResource.rewardVoucherTable.Vouchers.length);
			expect(localResource.rewardVoucherTable.Vouchers).to.have.members(result.data);
		});
		it('should claim a voucher', async () => {
			const result: Api.Reward.Voucher.Res.Claim = await rewardService.claimVoucher(localResource.claim);
			expect(result.customerUserId).to.equal(localResource.claim.user.id);
		});
	});
});
