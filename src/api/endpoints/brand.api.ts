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
		const result = await this.brandService.getLocationsForBrand(req.data.brandId, companyId!);
		res.sendData(result);
	}
}
