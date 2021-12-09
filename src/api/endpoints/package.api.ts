import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { boundMethod } from 'autobind-decorator';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import serviceFactory from '../../services/serviceFactory';
import publicUrl from '../../@decorators/publicUrl';
import UpsellPackageService from '../../services/packages/packages.service';
import { WebUtils } from '../../utils/utils';

export default class PackageApi extends GeneralApi {
	packageService: UpsellPackageService;
	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.packageService = serviceFactory.get<UpsellPackageService>('PackageService');

		this.app.get(`${pre}`, this.get);
		this.app.get(`${pre}/paged`, this.getByPage);
		this.app.get(`${pre}/availability`, this.getAvailable);
		this.app.put(`${pre}`, this.update);
	}

	@boundMethod
	async update(req: RsRequest<Api.UpsellPackage.Req.Update>, res: RsResponse<Api.UpsellPackage.Details>) {
		const result: Api.UpsellPackage.Details = await this.packageService.update(
			req.data,
			WebUtils.getCompanyId(req)
		);
		res.sendData(result);
	}

	@boundMethod
	async get(
		req: RsRequest<Api.UpsellPackage.Req.Get>,
		res: RsResponse<Api.UpsellPackage.Details | Api.UpsellPackage.Details[]>
	) {
		let details: Api.UpsellPackage.Details | Api.UpsellPackage.Details[];
		if (req.data.id) details = await this.packageService.getById(req.data.id, WebUtils.getCompanyId(req));
		else if (req.data.ids)
			details = await this.packageService.getManyByIds(req.data.ids, WebUtils.getCompanyId(req));
		res.sendData(details);
	}

	@boundMethod
	@publicUrl('GET', '/package/paged')
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.UpsellPackage.Details[]>) {
		let pageDetails = this.pageFilterData(req.data);
		let pagedResponse: RedSky.RsPagedResponseData<
			Api.UpsellPackage.Details[]
		> = await this.packageService.getByPage(
			pageDetails.pagination,
			pageDetails.sort,
			pageDetails.filter,
			WebUtils.getCompanyId(req)
		);
		res.sendPaginated(pagedResponse.data, pagedResponse.total);
	}

	@boundMethod
	@publicUrl('GET', '/package/availability/')
	async getAvailable(
		req: RsRequest<Api.UpsellPackage.Req.Availability>,
		res: RsResponse<Api.UpsellPackage.Res.Complete[]>
	) {
		let { pagination } = this.pageFilterData({ pagination: req.data.pagination });
		const upsellPackages = await this.packageService.getAvailable(
			{ ...req.data, pagination },
			WebUtils.getCompanyId(req)
		);
		res.sendPaginated(upsellPackages.data, upsellPackages.total);
	}
}
