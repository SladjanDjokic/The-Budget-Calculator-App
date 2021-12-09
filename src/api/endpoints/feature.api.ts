import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { boundMethod } from 'autobind-decorator';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import serviceFactory from '../../services/serviceFactory';
import FeatureService from '../../services/feature/feature.service';
import { WebUtils } from '../../utils/utils';

export default class FeatureApi extends GeneralApi {
	featureService: FeatureService;
	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.featureService = serviceFactory.get<FeatureService>('FeatureService');

		this.app.post(`${pre}`, this.create);
		this.app.get(`${pre}`, this.get);
		this.app.get(`${pre}/paged`, this.getByPage);
		this.app.put(`${pre}`, this.update);
		this.app.delete(`${pre}`, this.delete);
	}

	@boundMethod
	async create(req: RsRequest<Api.Feature.Req.Create>, res: RsResponse<Api.Feature.Details>) {
		const result: Api.Feature.Details = await this.featureService.create({
			...req.data,
			companyId: WebUtils.getCompanyId(req)
		});
		res.sendData(result);
	}

	@boundMethod
	async update(req: RsRequest<Api.Feature.Req.Update>, res: RsResponse<Api.Feature.Details>) {
		const result: Api.Feature.Details = await this.featureService.update(req.data.id, req.data);
		res.sendData(result);
	}

	@boundMethod
	async get(req: RsRequest<Api.Feature.Req.Get>, res: RsResponse<Api.Feature.Details | Api.Feature.Details[]>) {
		let details: Api.Feature.Details | Api.Feature.Details[];
		if (req.data?.id) details = await this.featureService.getById(req.data.id);
		else if (req.data?.ids) details = await this.featureService.getManyByIds(req.data.ids);
		res.sendData(details);
	}

	@boundMethod
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Feature.Details[]>) {
		let pageDetails = this.pageFilterData(req.data);
		let pagedResponse: RedSky.RsPagedResponseData<Api.Feature.Details[]> = await this.featureService.getByPage(
			pageDetails.pagination,
			pageDetails.sort,
			pageDetails.filter,
			WebUtils.getCompanyId(req)
		);
		res.sendPaginated(pagedResponse.data, pagedResponse.total);
	}

	@boundMethod
	async delete(req: RsRequest<Api.Feature.Req.Delete>, res: RsResponse<number | number[]>) {
		let result: number | number[];
		if (req.data?.id) result = await this.featureService.delete(WebUtils.getCompanyId(req), req.data.id);
		else if (req.data?.ids) result = await this.featureService.deleteMany(WebUtils.getCompanyId(req), req.data.ids);
		res.sendData(result);
	}
}
