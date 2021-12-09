import IRewardCategoryTable from '../../database/interfaces/IRewardCategoryTable';
import IRewardTable from '../../database/interfaces/IRewardTable';
import { Service } from '../Service';
import { DateUtils, ObjectUtils } from '../../utils/utils';
import IMediaService from '../media/IMediaService';
import logger from '../../utils/logger';
import IRewardCategoryMapTable from '../../database/interfaces/IRewardCategoryMapTable';
import IRewardVoucherTable from '../../database/interfaces/IRewardVoucherTable';
import { Claim } from '../../database/objects/rewardVoucher.db';
import IUserPointService from '../userPoint/IUserPointService';
import IEmailService, { EmailReplyType, EmailSendImmediate, EmailType } from '../email/IEmailService';
import IOrdersService from '../order/IOrdersService';
import { ServiceName } from '../serviceFactory';
import OrdersService from '../order/orders.service';
import UserPointService from '../userPoint/userPoint.service';
import MediaService from '../media/media.service';
import EmailService from '../email/email.service';

export default class RewardService extends Service {
	emailService: IEmailService;
	mediaService: IMediaService;
	userPointService: IUserPointService;
	ordersService: IOrdersService;
	constructor(
		private readonly rewardTable: IRewardTable,
		private readonly rewardCategoryTable: IRewardCategoryTable,
		private readonly rewardCategoryMapTable: IRewardCategoryMapTable,
		private readonly rewardVoucherTable: IRewardVoucherTable
	) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.emailService = services['EmailService'] as EmailService;
		this.mediaService = services['MediaService'] as MediaService;
		this.userPointService = services['UserPointService'] as UserPointService;
		this.ordersService = services['OrdersService'] as OrdersService;
	}

	getById(rewardId: number, companyId?: number): Promise<Api.Reward.Res.Get> {
		return this.rewardTable.getById(rewardId, companyId);
	}

	getManyByIds(rewardIds: readonly number[], companyId?: number): Promise<Api.Reward.Res.Get[]> {
		return this.rewardTable.getManyByIds(rewardIds, companyId);
	}

	getByPage(
		{ pagination, sort, filter }: Api.Reward.Req.Paged,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Reward.Res.Get[]>> {
		return this.rewardTable.getByPage(pagination, sort, filter, companyId);
	}

	customerGetByPage(
		{
			pagination,
			vendorBrandIds,
			vendorDestinationIds,
			rewardCategoryIds,
			minPointCost,
			maxPointCost
		}: Api.Reward.Req.CustomerPaged,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Reward.Res.Get[]>> {
		return this.rewardTable.customerGetByPage(
			pagination,
			vendorBrandIds,
			vendorDestinationIds,
			rewardCategoryIds,
			minPointCost,
			maxPointCost,
			companyId
		);
	}

	async create(
		{ mediaDetails, categoryIds, ...newReward }: Api.Reward.Req.Create,
		companyId: number
	): Promise<Api.Reward.Res.Create> {
		const newRewardModel: Partial<Model.Reward> = {
			...newReward,
			...{
				companyId,
				isActive: 1
			}
		};
		const createdReward: Model.Reward = await this.rewardTable.create(newRewardModel, companyId);
		await this.createMediaMapAndSetMediaProperty(mediaDetails, { rewardId: createdReward.id });
		await this.createCategoryMaps(categoryIds, createdReward.id);
		return this.getById(createdReward.id, companyId);
	}

	async createCategoryMaps(categoryIds: number[], rewardId: number): Promise<void> {
		for (let categoryId of categoryIds) {
			try {
				await this.rewardCategoryMapTable.create({
					categoryId,
					rewardId
				});
			} catch (e) {
				logger.warn(e);
			}
		}
	}

	async update(
		{ id, categoryIds, mediaDetails, ...updates }: Api.Reward.Req.Update,
		companyId: number
	): Promise<Api.Reward.Res.Update> {
		const updatedReward = await this.rewardTable.update(id, updates, companyId);
		if (categoryIds) await this.updateCategoryMaps(updatedReward.id, categoryIds);
		if (mediaDetails)
			await this.mediaService.updateMediaMapAndSetMediaProperty(mediaDetails, { rewardId: updatedReward.id });
		return this.getById(updatedReward.id, companyId);
	}

	async updateCategoryMaps(rewardId: number, categoryIds: number[]): Promise<void> {
		await this.rewardCategoryMapTable.deleteByRewardId(rewardId);
		await this.createCategoryMaps(categoryIds, rewardId);
	}

	deactivate(rewardId: number, companyId: number): Promise<number> {
		return this.rewardTable.deactivate(rewardId, companyId);
	}

	updateActiveStatus(rewardId: number, companyId: number): Promise<number> {
		let result = this.rewardTable.updateActiveStatus(rewardId, companyId);
		if (!!!result) throw new Error('Something unexpected happened.');
		return result;
	}

	getCategory(rewardCategoryId: number): Promise<Api.Reward.Category.Res.Get> {
		return this.rewardCategoryTable.getById(rewardCategoryId);
	}

	getCategories(rewardCategoryIds: number[]): Promise<Api.Reward.Category.Res.Get[]> {
		return this.rewardCategoryTable.getManyByIds(rewardCategoryIds);
	}

	getCategoriesByPage(
		{ pagination, sort, filter }: RedSky.PageQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Reward.Category.Res.Get[]>> {
		return this.rewardCategoryTable.getByPage(pagination, sort, filter, companyId);
	}

	async createCategory({
		mediaDetails,
		...createDetails
	}: Api.Reward.Category.Req.Create): Promise<Api.Reward.Category.Res.Create> {
		const createdCategory = await this.rewardCategoryTable.create({ ...createDetails });
		await this.createMediaMapAndSetMediaProperty(mediaDetails, { rewardCategoryId: createdCategory.id });
		return this.rewardCategoryTable.getById(createdCategory.id);
	}

	async updateCategory({
		id,
		mediaDetails,
		...updates
	}: Api.Reward.Category.Req.Update): Promise<Api.Reward.Category.Res.Update> {
		const updatedCategory = await this.rewardCategoryTable.update(id, updates);
		if (mediaDetails)
			await this.mediaService.updateMediaMapAndSetMediaProperty(mediaDetails, {
				rewardCategoryId: updatedCategory.id
			});
		return this.rewardCategoryTable.getById(updatedCategory.id);
	}

	async deactivateCategory(categoryId: number): Promise<number> {
		return await this.rewardCategoryTable.deactivate(categoryId);
	}

	createVouchers(
		{ rewardId, codes }: Api.Reward.Voucher.Req.Create,
		companyId: number
	): Promise<Model.RewardVoucher[]> {
		const newVouchers = codes.map((code) => {
			return {
				rewardId,
				companyId,
				code
			} as Partial<Model.RewardVoucher>;
		});
		return this.rewardVoucherTable.createMany(newVouchers);
	}

	getVouchersByPage(
		{ pagination, sort, filter }: RedSky.PageQuery,
		companyId: number
	): Promise<RedSky.RsPagedResponseData<Api.Reward.Voucher.Res.Get[]>> {
		return this.rewardVoucherTable.getByPage(pagination, sort, filter, companyId);
	}

	deactivateVoucher(
		{ rewardId, code }: Api.Reward.Voucher.Req.Delete,
		companyId: number
	): Promise<Api.Reward.Voucher.Res.Delete> {
		return this.rewardVoucherTable.deactivate(rewardId, code, companyId);
	}

	async claimVoucher(claimDetails: Claim): Promise<Api.Reward.Voucher.Res.Claim> {
		const reward: Model.Reward = await this.rewardTable.getRewardOnly(claimDetails.rewardId);
		const claimedVoucher: Model.RewardVoucher = await this.rewardVoucherTable.claim(claimDetails);
		await this.userPointService.create({
			userId: claimDetails.user.id,
			pointType: 'VOUCHER',
			pointAmount: reward.pointCost,
			reason: 'VOUCHER_CLAIM',
			status: 'REDEEMED',
			rewardVoucherId: claimedVoucher.id
		});
		let orderToCreate: Api.Order.Req.Create = {
			rewardId: reward.id,
			status: 'PENDING',
			type: ''
		};
		await this.ordersService.create(orderToCreate, claimDetails.user.id);
		let emailObj: EmailSendImmediate = {
			templateType: EmailType.VOUCHER_ORDER_CONFIRMATION,
			recipientEmail: claimDetails.user.primaryEmail,
			emailReplyType: EmailReplyType.DEFAULT,
			metaData: {
				first_name: claimDetails.user.firstName,
				last_name: claimDetails.user.lastName,
				order_number: claimDetails.code,
				order_date: DateUtils.displayDate(new Date()),
				order_total: reward.pointCost.toString(),
				item: reward.name,
				redemption_instructions: reward.redemptionInstructions || ''
			}
		};
		await this.emailService.sendImmediate(emailObj);
		return claimedVoucher;
	}

	private async createMediaMapAndSetMediaProperty(
		rewardMedia: Api.MediaDetails[],
		mediaMapKey: { [key: string]: number }
	) {
		if (!ObjectUtils.isArrayWithData(rewardMedia)) return;
		for (let mediaItem of rewardMedia) {
			await this.mediaService.createMediaMapAndSetMediaProperty(mediaItem.id, mediaMapKey, {
				isPrimary: mediaItem.isPrimary
			});
		}
	}
}
