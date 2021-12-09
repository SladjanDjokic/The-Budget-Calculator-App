import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import serviceFactory from '../../services/serviceFactory';
import RegionService from '../../services/region/region.service';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import { boundMethod } from 'autobind-decorator';
import accessScopes from '../../@decorators/accessScopes';
import publicUrl from '../../@decorators/publicUrl';

export default class RegionApi extends GeneralApi {
	regionService: RegionService;

	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;
		this.app.post(pre, this.create);
		this.app.put(pre, this.update);
		this.app.get(pre, this.get);
		this.app.get(`${pre}/paged`, this.getByPage);
		this.regionService = serviceFactory.get<RegionService>('RegionService');
	}

	@boundMethod
	@publicUrl('GET', '/region')
	async get(req: RsRequest<Api.Region.Req.Get>, res: RsResponse<Api.Region.Res.Get[]>) {
		const regions: Api.Region.Res.Get[] = await this.regionService.get();
		res.sendData(regions);
	}

	@boundMethod
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Region.Res.Detail[]>) {
		let pageDetails = this.pageFilterData(req.data);
		let pagedCampaigns: RedSky.RsPagedResponseData<Api.Region.Res.Detail[]> = await this.regionService.getByPage(
			pageDetails.pagination,
			pageDetails.sort,
			pageDetails.filter
		);
		res.sendPaginated(pagedCampaigns.data, pagedCampaigns.total);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async create(req: RsRequest<Api.Region.Req.Create>, res: RsResponse<Api.Region.Res.Get>) {
		const region: Api.Region.Res.Get = await this.regionService.create(req.data);
		res.sendData(region);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async update(req: RsRequest<Api.Region.Req.Update>, res: RsResponse<Api.Region.Res.Get>) {
		const updatedRegion = await this.regionService.update(req.data);
		res.sendData(updatedRegion);
	}
}
