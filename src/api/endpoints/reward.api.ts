import { RsResponse } from '../../@types/expressCustom';
import { RsRequest } from '../../@types/expressCustom';
import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import RewardService from '../../services/reward/reward.service';
import serviceFactory from '../../services/serviceFactory';
import { boundMethod } from 'autobind-decorator';
import accessScopes from '../../@decorators/accessScopes';
import publicUrl from '../../@decorators/publicUrl';
import { WebUtils } from '../../utils/utils';

export default class RewardApi extends GeneralApi {
	private rewardService: RewardService;

	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.app.get(pre, this.get);
		this.app.get(pre + '/paged', this.getByPage);
		this.app.get(pre + '/customer/paged', this.customerGetByPage);
		this.app.post(pre, this.create);
		this.app.put(pre, this.update);
		this.app.delete(pre, this.deactivate);
		this.app.put(pre + '/updateActiveStatus', this.updateActiveStatus);
		this.app.get(pre + '/category/paged', this.getCategoriesByPage);
		this.app.get(pre + '/category', this.getCategories);
		this.app.post(pre + '/category', this.createCategory);
		this.app.put(pre + '/category', this.updateCategory);
		this.app.delete(pre + '/category', this.deactivateCategory);
		this.app.post(pre + '/voucher', this.createVouchers);
		this.app.delete(pre + '/voucher', this.deactivateVoucher);
		this.app.get(pre + '/voucher/paged', this.getVouchersByPage);
		this.app.put(pre + '/voucher/claim', this.claimVoucher);

		this.rewardService = serviceFactory.get('RewardService');
	}

	@boundMethod
	@publicUrl('GET', '/reward')
	async get(req: RsRequest<Api.Reward.Req.Get>, res: RsResponse<Api.Reward.Res.Get | Api.Reward.Res.Get[]>) {
		let result: Api.Reward.Res.Get | Api.Reward.Res.Get[];
		if (req.data?.id) {
			result = await this.rewardService.getById(req.data.id, WebUtils.getCompanyId(req));
		} else if (req.data.ids) {
			result = await this.rewardService.getManyByIds(req.data.ids, WebUtils.getCompanyId(req));
		}
		res.sendData(result);
	}

	@boundMethod
	@publicUrl('GET', '/reward/paged')
	async getByPage(req: RsRequest<Api.Reward.Req.Paged>, res: RsResponse<Api.Reward.Res.Get[]>) {
		let pageDetails = this.pageFilterData(req.data);
		let rewardResponse: RedSky.RsPagedResponseData<Api.Reward.Res.Get[]> = await this.rewardService.getByPage(
			{ ...req.data, ...pageDetails },
			WebUtils.getCompanyId(req)
		);
		res.sendPaginated(rewardResponse.data, rewardResponse.total);
	}

	@boundMethod
	@publicUrl('GET', '/reward/customer/paged')
	async customerGetByPage(req: RsRequest<Api.Reward.Req.CustomerPaged>, res: RsResponse<Api.Reward.Res.Get[]>) {
		let rewardResponse: RedSky.RsPagedResponseData<
			Api.Reward.Res.Get[]
		> = await this.rewardService.customerGetByPage(req.data, WebUtils.getCompanyId(req));
		res.sendPaginated(rewardResponse.data, rewardResponse.total);
	}

	@boundMethod
	@publicUrl('GET', '/reward/category')
	async getCategories(
		req: RsRequest<Api.Reward.Category.Req.Get>,
		res: RsResponse<Api.Reward.Category.Res.Get | Api.Reward.Category.Res.Get[]>
	) {
		let result: Api.Reward.Category.Res.Get | Api.Reward.Category.Res.Get[];
		if (req.data.id) result = await this.rewardService.getCategory(req.data.id);
		else if (req.data.ids) result = await this.rewardService.getCategories(req.data.ids);
		res.sendData(result);
	}

	@boundMethod
	@publicUrl('GET', '/reward/category/paged')
	async getCategoriesByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Reward.Category.Res.Get[]>) {
		let pageDetails = this.pageFilterData(req.data);
		let categoryResponse: RedSky.RsPagedResponseData<
			Api.Reward.Category.Res.Get[]
		> = await this.rewardService.getCategoriesByPage(pageDetails, WebUtils.getCompanyId(req));
		res.sendPaginated(categoryResponse.data, categoryResponse.total);
	}

	@boundMethod
	@accessScopes('LOYALTY_REWARDS', 'ADMINISTRATION')
	async createCategory(
		req: RsRequest<Api.Reward.Category.Req.Create>,
		res: RsResponse<Api.Reward.Category.Res.Create>
	) {
		const newCategory = await this.rewardService.createCategory(req.data);
		res.sendData(newCategory);
	}

	@boundMethod
	@accessScopes('LOYALTY_REWARDS', 'ADMINISTRATION')
	async updateCategory(
		req: RsRequest<Api.Reward.Category.Req.Update>,
		res: RsResponse<Api.Reward.Category.Res.Update>
	) {
		const updatedCategory = await this.rewardService.updateCategory(req.data);
		res.sendData(updatedCategory);
	}

	@boundMethod
	@accessScopes('LOYALTY_REWARDS', 'ADMINISTRATION')
	async deactivateCategory(req: RsRequest<Api.Reward.Category.Req.Delete>, res: RsResponse<number>) {
		const result: number = await this.rewardService.deactivateCategory(req.data.id);
		res.sendData(result);
	}

	@boundMethod
	@accessScopes('LOYALTY_REWARDS', 'ADMINISTRATION')
	async create(req: RsRequest<Api.Reward.Req.Create>, res: RsResponse<Api.Reward.Res.Create>) {
		const newReward = await this.rewardService.create(req.data, WebUtils.getCompanyId(req));
		res.sendData(newReward);
	}

	@boundMethod
	@accessScopes('LOYALTY_REWARDS', 'ADMINISTRATION')
	async update(req: RsRequest<Api.Reward.Req.Update>, res: RsResponse<Api.Reward.Res.Update>) {
		const updatedReward = await this.rewardService.update(req.data, WebUtils.getCompanyId(req));
		res.sendData(updatedReward);
	}

	@boundMethod
	@accessScopes('LOYALTY_REWARDS', 'ADMINISTRATION')
	async deactivate(req: RsRequest<Api.Reward.Req.Delete>, res: RsResponse<number>) {
		const result: number = await this.rewardService.deactivate(req.data.id, WebUtils.getCompanyId(req));
		res.sendData(result);
	}

	@boundMethod
	@accessScopes('LOYALTY_REWARDS', 'ADMINISTRATION')
	async updateActiveStatus(req: RsRequest<Api.Reward.Req.Delete>, res: RsResponse<number>) {
		const result: number = await this.rewardService.updateActiveStatus(req.data.id, WebUtils.getCompanyId(req));
		res.sendData(result);
	}

	@boundMethod
	@accessScopes('LOYALTY_REWARDS', 'ADMINISTRATION')
	async createVouchers(
		req: RsRequest<Api.Reward.Voucher.Req.Create>,
		res: RsResponse<Api.Reward.Voucher.Res.Create[]>
	) {
		const result = await this.rewardService.createVouchers(req.data, WebUtils.getCompanyId(req));
		res.sendData(result);
	}

	@boundMethod
	async getVouchersByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Reward.Voucher.Res.Get[]>) {
		let pageDetails = this.pageFilterData(req.data);
		let voucherResponse: RedSky.RsPagedResponseData<
			Api.Reward.Voucher.Res.Get[]
		> = await this.rewardService.getVouchersByPage(pageDetails, WebUtils.getCompanyId(req));
		res.sendPaginated(voucherResponse.data, voucherResponse.total);
	}

	@boundMethod
	@accessScopes('LOYALTY_REWARDS', 'ADMINISTRATION')
	async deactivateVoucher(
		req: RsRequest<Api.Reward.Voucher.Req.Delete>,
		res: RsResponse<Api.Reward.Voucher.Res.Delete>
	) {
		const result = await this.rewardService.deactivateVoucher(req.data, WebUtils.getCompanyId(req));
		res.sendData(result);
	}

	@boundMethod
	async claimVoucher(req: RsRequest<Api.Reward.Voucher.Req.Claim>, res: RsResponse<Api.Reward.Voucher.Res.Claim>) {
		const result: Api.Reward.Voucher.Res.Claim = await this.rewardService.claimVoucher({
			...req.data,
			user: req.user
		});
		res.sendData(result);
	}
}
