import serviceFactory from '../../services/serviceFactory';
import BrandService from '../../services/brand/brand.service';
import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import { boundMethod } from 'autobind-decorator';
import accessScopes from '../../@decorators/accessScopes';
import { RsError } from '../../utils/errors';
import { WebUtils } from '../../utils/utils';

export default class Brand extends GeneralApi {
	private readonly brandService: BrandService;

	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.app.get(`${pre}`, this.get);
		this.app.get(`${pre}/location`, this.getLocations);
		this.app.get(`${pre}/details`, this.getDetails);
		this.app.get(`${pre}/paged`, this.getByPage);
		this.app.get(`${pre}/location/details`, this.getLocationDetails);
		this.app.get(`${pre}/location/paged`, this.getLocationsByPage);
		this.app.patch(`${pre}`, this.updateBrand);
		this.app.patch(`${pre}/location`, this.updateBrandLocation);

		this.brandService = serviceFactory.get<BrandService>('BrandService');
	}

	@boundMethod
	@accessScopes('ADMINISTRATION', 'LOYALTY_CAMPAIGNS')
	async get(req: RsRequest<null>, res: RsResponse<Api.Brand.Res.Get[]>) {
		const companyId = WebUtils.getCompanyId(req);
		if (!companyId) throw new RsError('FORBIDDEN');
		const result = await this.brandService.getAllForCompany(companyId!);
		res.sendData(result);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION', 'LOYALTY_CAMPAIGNS')
	async getLocations(req: RsRequest<Api.Brand.Req.Location>, res: RsResponse<Api.Brand.Res.Location[]>) {
		const companyId = WebUtils.getCompanyId(req);
		if (!companyId) throw new RsError('FORBIDDEN');
		const result = await this.brandService.getLocationsForBrand(req.data.id);
		res.sendData(result);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async getDetails(req: RsRequest<Api.Brand.Req.Get>, res: RsResponse<Api.Brand.Res.Details>) {
		const result = await this.brandService.getDetails(req.data.id, WebUtils.getCompanyId(req));
		res.sendData(result);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Brand.Res.Details[]>) {
		const result = await this.brandService.getByPage(req.data, WebUtils.getCompanyId(req));
		res.sendPaginated(result.data, result.total);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async updateBrand(req: RsRequest<Api.Brand.Req.Update>, res: RsResponse<Api.Brand.Res.Details>) {
		const result = await this.brandService.update(req.data, WebUtils.getCompanyId(req));
		res.sendData(result);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async getLocationDetails(
		req: RsRequest<Api.Brand.Req.Location.Get>,
		res: RsResponse<Api.Brand.Res.Location.Details>
	) {
		const result = await this.brandService.getLocationDetails(req.data.id);
		res.sendData(result);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async getLocationsByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Brand.Res.Location.Details[]>) {
		const result = await this.brandService.getLocationsByPage(req.data, WebUtils.getCompanyId(req));
		res.sendPaginated(result.data, result.total);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async updateBrandLocation(
		req: RsRequest<Api.Brand.Req.Location.Update>,
		res: RsResponse<Api.Brand.Res.Location.Details>
	) {
		const result = await this.brandService.updateLocation(req.data.id, req.data);
		res.sendData(result);
	}
}
