import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import { RsError } from '../../utils/errors';
import serviceFactory from '../../services/serviceFactory';
import { boundMethod } from 'autobind-decorator';
import CampaignService from '../../services/campaign/campaign.service';
import accessScopes from '../../@decorators/accessScopes';
import { WebUtils } from '../../utils/utils';

export default class CampaignApi extends GeneralApi {
	campaignService: CampaignService;
	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.app.post(pre, this.create);
		this.app.get(pre, this.get);
		this.app.get(`${pre}/paged`, this.getByPage);
		this.app.put(pre, this.update);
		this.app.delete(pre, this.delete);

		this.campaignService = serviceFactory.get<CampaignService>('CampaignService');
	}

	@boundMethod
	@accessScopes('ADMINISTRATION', 'LOYALTY_CAMPAIGNS')
	async create(req: RsRequest<Api.Campaign.Req.Create>, res: RsResponse<Api.Campaign.Res.Get>) {
		let obj = this.getCreateObjectFromRequest(req, this.campaignService.getColumns());
		obj.actions = req.data.actions;
		let createdObj: Api.Campaign.Detail = await this.campaignService.create({
			...obj,
			companyId: WebUtils.getCompanyId(req)
		});
		res.sendData(createdObj);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION', 'LOYALTY_CAMPAIGNS')
	async get(req: RsRequest<Api.Campaign.Req.Get>, res: RsResponse<Api.Campaign.Res.Get | Api.Campaign.Res.Get[]>) {
		if (!!req.data.id) {
			let campaign: Api.Campaign.Detail = await this.campaignService.getById(
				req.data.id,
				WebUtils.getCompanyId(req)
			);
			res.sendData(campaign);
		} else if (req.data.ids) {
			let campaignsList: Api.Campaign.Detail[] = await this.campaignService.getManyByIds(
				req.data.ids,
				WebUtils.getCompanyId(req)
			);
			res.sendData(campaignsList);
		} else throw new RsError('BAD_REQUEST', 'Missing id or ids');
	}

	@boundMethod
	@accessScopes('ADMINISTRATION', 'LOYALTY_CAMPAIGNS')
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Campaign.Res.Get>) {
		let pageDetails = this.pageFilterData(req.data);
		let pagedCampaigns: RedSky.RsPagedResponseData<Api.Campaign.Detail> = await this.campaignService.getByPage(
			pageDetails.pagination,
			pageDetails.sort,
			pageDetails.filter,
			WebUtils.getCompanyId(req)
		);
		res.sendPaginated(pagedCampaigns.data, pagedCampaigns.total);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION', 'LOYALTY_CAMPAIGNS')
	async update(req: RsRequest<Api.Campaign.Req.Update>, res: RsResponse<Api.Campaign.Res.Get>) {
		let updatedObjIdResponse = await this.campaignService.update(req.data.id, {
			companyId: WebUtils.getCompanyId(req),
			...req.data
		});
		res.sendData(updatedObjIdResponse);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION', 'LOYALTY_CAMPAIGNS')
	async delete(req: RsRequest<Api.Campaign.Req.Delete>, res: RsResponse<number>) {
		let deletedObjIdResponse: number = await this.campaignService.delete(req.data.id, WebUtils.getCompanyId(req));
		res.sendData(deletedObjIdResponse);
	}
}
