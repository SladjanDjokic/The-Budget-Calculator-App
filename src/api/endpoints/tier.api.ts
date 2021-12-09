import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import serviceFactory from '../../services/serviceFactory';
import TierService from '../../services/tier/tier.service';
import { boundMethod } from 'autobind-decorator';
import accessScopes from '../../@decorators/accessScopes';

export default class TierApi extends GeneralApi {
	tierService: TierService;
	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.app.post(pre, this.create);
		this.app.get(pre, this.get);
		this.app.get(`${pre}/paged`, this.getByPage);
		this.app.put(pre, this.update);
		this.app.delete(pre, this.delete);
		this.app.post(`${pre}/feature`, this.createFeature);
		this.app.get(`${pre}/features`, this.getFeatures);
		this.app.get(`${pre}/feature`, this.getFeature);
		this.app.put(`${pre}/feature`, this.updateFeature);
		this.app.delete(`${pre}/feature`, this.deleteFeature);

		this.tierService = serviceFactory.get('TierService');
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async create(req: RsRequest<Api.Tier.Req.Create>, res: RsResponse<Api.Tier.Res.Get>) {
		let obj = this.getCreateObjectFromRequest(req, this.tierService.getTierFields());
		obj.featureIds = req.data.featureIds;
		obj.mediaDetails = req.data.mediaDetails;
		let createdObj = await this.tierService.create(obj);
		res.sendData(createdObj);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async createFeature(req: RsRequest<Api.Tier.Req.CreateFeature>, res: RsResponse<Api.Tier.Res.CreateFeature>) {
		const featureResult = await this.tierService.createFeature(req.data.name);
		res.sendData(featureResult);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async get(req: RsRequest<Api.Tier.Req.Get>, res: RsResponse<Api.Tier.Res.Get>) {
		let obj = await this.tierService.getById(req.data.id);
		res.sendData(obj);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async getFeatures(req: RsRequest<null>, res: RsResponse<Api.Tier.Res.GetFeatures[]>) {
		const featureResponse = await this.tierService.getFeatures();
		res.sendData(featureResponse);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async getFeature(req: RsRequest<Api.Tier.Req.GetFeature>, res: RsResponse<Api.Tier.Res.GetFeature>) {
		const featureResponse = await this.tierService.getFeature(req.data.id);
		res.sendData(featureResponse);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Tier.Res.Get[]>) {
		let pageDetails = this.pageFilterData(req.data);
		let tierResponse: RedSky.RsPagedResponseData<Api.Tier.Res.Get[]> = await this.tierService.getByPage(
			pageDetails.pagination,
			pageDetails.sort,
			pageDetails.filter
		);
		res.sendPaginated(tierResponse.data, tierResponse.total);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async update(req: RsRequest<Api.Tier.Req.Update>, res: RsResponse<Api.Tier.Res.Get>) {
		let updatedObjIdResponse = await this.tierService.update(req.data.id, req.data);
		res.sendData(updatedObjIdResponse);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async updateFeature(req: RsRequest<Api.Tier.Req.Update>, res: RsResponse<Api.Tier.Res.GetFeature>) {
		let updatedObjIdResponse = await this.tierService.updateFeature(req.data.id, req.data);
		res.sendData(updatedObjIdResponse);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async delete(req: RsRequest<Api.Tier.Req.Delete>, res: RsResponse<number>) {
		let deletedObjIdResponse = await this.tierService.delete(req.data.id);
		res.sendData(deletedObjIdResponse);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async deleteFeature(req: RsRequest<Api.Tier.Req.DeleteFeature>, res: RsResponse<number>) {
		let deletedObjIdResponse = await this.tierService.deleteFeature(req.data.id);
		res.sendData(deletedObjIdResponse);
	}
}
