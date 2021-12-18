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
		this.app.get(`${pre}/reports`, this.getReportsByPage);
		this.app.get(`${pre}/reports/export`, this.exportBrandsReport);
		this.app.get(`${pre}/location/reports`, this.getLocationsOverviewByPage);
		this.app.get(`${pre}/location/reports/export`, this.exportLocationsOverviewReport);
		this.app.get(`${pre}/location/transactions`, this.getBrandLocationTransactionsByPage);
		this.app.get(`${pre}/location/transactions/export`, this.exportBrandLocationReport);

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
	async getLocations(req: RsRequest<Api.Brand.Req.Get>, res: RsResponse<Api.Brand.Res.Location.Get[]>) {
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
	async getReportsByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Brand.Res.Report[]>) {
		const pagedResponse: RedSky.RsPagedResponseData<
			Api.Brand.Res.Report[]
		> = await this.brandService.getReportsByPage(req.data, WebUtils.getCompanyId(req));
		res.sendPaginated(pagedResponse.data, pagedResponse.total);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async exportBrandsReport(req: RsRequest<null>, res: RsResponse<any>) {
		const result = await this.brandService.exportBrandsReport(WebUtils.getCompanyId(req));
		const date = new Date();
		res.setHeader(
			'Content-disposition',
			`attachment; filename=brands_${date.getMonth()}-${date.getDate()}-${date.getFullYear()}.csv`
		);
		res.send(WebUtils.convertToCSV<Api.Brand.Res.Report>(result));
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async exportBrandLocationReport(req: RsRequest<Api.Brand.Req.Location.Get>, res: RsResponse<string>) {
		const result = await this.brandService.exportBrandLocationReport(req.data.id, WebUtils.getCompanyId(req));
		const date = new Date();
		res.setHeader(
			'Content-disposition',
			`attachment; filename=brandLocation-${
				req.data.id
			}_${date.getMonth()}-${date.getDate()}-${date.getFullYear()}.csv`
		);
		res.send(WebUtils.convertToCSV<Api.Brand.Res.Location.Transaction>(result));
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async getBrandLocationTransactionsByPage(
		req: RsRequest<Api.Brand.Req.Location.Report>,
		res: RsResponse<Api.Brand.Res.Location.Transaction[]>
	) {
		const result = await this.brandService.getBrandLocationTransactionsByPage(
			req.data.id,
			req.data.pageQuery,
			WebUtils.getCompanyId(req)
		);
		res.sendPaginated(result.data, result.total);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async getLocationsOverviewByPage(req: RsRequest<Api.Brand.Req.Report>, res: RsResponse<Api.Brand.Res.Report[]>) {
		const result = await this.brandService.getLocationsOverviewByPage(
			req.data.id,
			req.data.pageQuery,
			WebUtils.getCompanyId(req)
		);
		res.sendPaginated(result.data, result.total);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async exportLocationsOverviewReport(req: RsRequest<Api.Brand.Req.Get>, res: RsResponse<string>) {
		const result = await this.brandService.exportLocationsOverviewReport(req.data.id, WebUtils.getCompanyId(req));
		const date = new Date();
		res.setHeader(
			'Content-disposition',
			`attachment; filename=location-overview-brand-${
				req.data.id
			}_${date.getMonth()}-${date.getDate()}-${date.getFullYear()}.csv`
		);
		res.send(WebUtils.convertToCSV<Api.Brand.Res.Report>(result));
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async getLocationsByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Brand.Res.Location.Details[]>) {
		const result = await this.brandService.getLocationsByPage(req.data);
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
