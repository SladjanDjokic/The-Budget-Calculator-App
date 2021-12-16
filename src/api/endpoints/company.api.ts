import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import { RsError } from '../../utils/errors';
import serviceFactory from '../../services/serviceFactory';
import CompanyService from '../../services/company/company.service';
import { boundMethod } from 'autobind-decorator';
import accessScopes from '../../@decorators/accessScopes';
import publicUrl from '../../@decorators/publicUrl';
import { WebUtils } from '../../utils/utils';

export default class CompanyApi extends GeneralApi {
	companyService: CompanyService;

	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.app.get(pre, this.get);
		this.app.get(`${pre}/details`, this.getDetails);
		this.app.get(`${pre}/paged`, this.getByPage);
		this.app.get(`${pre}/company-and-variables`, this.getCompanyAndClientVariables);
		this.app.put(`${pre}/unauthorized-pages`, this.updateUnauthorizedPages);
		this.app.put(`${pre}/available-pages`, this.updateAvailablePages);
		this.app.patch(`${pre}`, this.updateCompany);
		this.app.get(`${pre}/available-pages`, this.getAvailablePages);

		this.app.put(pre, this.update);

		this.app.post(pre, this.create);

		this.companyService = serviceFactory.get('CompanyService');
	}

	@boundMethod
	@accessScopes('COMPANY')
	async create(req: RsRequest<Api.Company.Req.Create>, res: RsResponse<Api.Company.Res.Get>) {
		let createdCompany = await this.companyService.create(req.data);
		res.sendData(createdCompany);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async get(req: RsRequest<Api.Company.Req.Get>, res: RsResponse<Api.Company.Res.Get>) {
		let obj = await this.companyService.getById(req.data.id);
		res.sendData(obj);
	}

	@boundMethod
	@publicUrl('GET', '/company/paged')
	@accessScopes('COMPANY')
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Company.Res.Details[]>) {
		let pageQuery = this.pageFilterData(req.data);
		let companyPagedResponse = await this.companyService.getByPage(pageQuery);
		res.sendPaginated(companyPagedResponse.data, companyPagedResponse.total);
	}

	@boundMethod
	@publicUrl('GET', '/company')
	@accessScopes('COMPANY')
	async getDetails(req: RsRequest<Api.Company.Req.Get>, res: RsResponse<Api.Company.Res.Details>) {
		let companyDetails = await this.companyService.getDetailsById(req.data.id);
		res.sendData(companyDetails);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async updateCompany(req: RsRequest<Api.Company.Req.Update>, res: RsResponse<Api.Company.Res.Details>) {
		const result = await this.companyService.update(req.data.id, req.data);
		res.sendData(result);
	}

	@boundMethod
	@publicUrl('GET', '/company/company-and-variables')
	async getCompanyAndClientVariables(
		req: RsRequest<void>,
		res: RsResponse<Api.Company.Res.GetCompanyAndClientVariables>
	) {
		let obj = await this.companyService.getCompanyAndClientVariables(WebUtils.getCompanyId(req));
		res.sendData(obj);
	}

	@boundMethod
	@accessScopes('COMPANY')
	async update(req: RsRequest<Api.Company.Req.Update>, res: RsResponse<Api.Company.Res.Get>) {
		if (req.data.id) {
			let updatedObjIdResponse = await this.companyService.update(req.data.id, req.data);
			res.sendData(updatedObjIdResponse);
		} else throw new RsError('BAD_REQUEST');
	}

	@boundMethod
	@accessScopes('COMPANY')
	async delete(req: RsRequest<Api.Company.Req.Delete>, res: RsResponse<number>) {
		if (req.data.id) {
			let deletedObjIdResponse = await this.companyService.delete(req.data.id);
			res.sendData(deletedObjIdResponse);
		} else throw new RsError('BAD_REQUEST');
	}

	@boundMethod
	async updateUnauthorizedPages(req: RsRequest<Api.Company.Req.UpdateUnauthorizedPages>, res: RsResponse<boolean>) {
		const result: boolean = await this.companyService.updateCompanyVariables(WebUtils.getCompanyId(req), {
			unauthorizedPages: req.data.unauthorizedPages
		});
		res.sendData(result);
	}

	@boundMethod
	@publicUrl('PUT', '/company/available-pages')
	async updateAvailablePages(req: RsRequest<Api.Company.Req.UpdateAvailablePages>, res: RsResponse<boolean>) {
		const result: boolean = await this.companyService.updateAvailablePages(req.data.availablePages);
		res.sendData(result);
	}

	@boundMethod
	@publicUrl('GET', '/company/available-pages')
	async getAvailablePages(req: RsRequest<void>, res: RsResponse<Model.PageGuard[]>) {
		const result: Model.PageGuard[] = await this.companyService.getAvailablePages(WebUtils.getCompanyId(req));
		res.sendData(result);
	}
}
