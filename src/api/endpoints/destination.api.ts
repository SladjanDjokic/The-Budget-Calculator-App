import { RsError } from '../../utils/errors';
import { RsResponse, RsRequest } from '../../@types/expressCustom';
import DestinationService from '../../services/destination/destination.service';
import serviceFactory from '../../services/serviceFactory';
import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { boundMethod } from 'autobind-decorator';
import AccommodationService from '../../services/accommodation/accommodation.service';
import publicUrl from '../../@decorators/publicUrl';
import { WebUtils } from '../../utils/utils';
import roleAuthorization from '../../@decorators/roleAuthorization';

export default class DestinationApi extends GeneralApi {
	destinationService: DestinationService;
	accommodationService: AccommodationService;

	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.app.get(pre, this.get);
		this.app.get(`${pre}/propertyType`, this.getPropertyTypes);
		this.app.get(`${pre}/allPropertyTypes`, this.getAllPropertyTypes);
		this.app.get(`${pre}/paged`, this.getByPage);
		this.app.put(`${pre}`, this.update);
		this.app.get(`${pre}/details`, this.getDetails);
		this.app.get(`${pre}/availability`, this.getAvailable);

		this.accommodationService = serviceFactory.get('AccommodationService');
		this.destinationService = serviceFactory.get('DestinationService');
	}

	@boundMethod
	async get(req: RsRequest<Api.Destination.Req.Get>, res: RsResponse<Api.Destination.Res.Get>) {
		if (req.data.id) {
			let obj: Api.Destination.Res.Get = ((await this.destinationService.getById(
				req.data.id,
				WebUtils.getCompanyId(req)
			)) as unknown) as Api.Destination.Res.Get;
			res.sendData(obj);
		} else if (req.data.ids) {
			let objs = await this.destinationService.getManyByIds(req.data.ids, WebUtils.getCompanyId(req));
			res.sendData(objs);
		} else {
			const objs: any = await this.destinationService.getForCompany(WebUtils.getCompanyId(req));
			res.sendData(objs);
		}
	}

	@boundMethod
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Destination.Res.Details[]>) {
		let pageDetails = this.pageFilterData(req.data);
		let pagedResponse: RedSky.RsPagedResponseData<
			Api.Destination.Res.Details[]
		> = await this.destinationService.getByPage(
			pageDetails.pagination,
			pageDetails.sort,
			pageDetails.filter,
			WebUtils.getCompanyId(req)
		);
		res.sendPaginated(pagedResponse.data, pagedResponse.total);
	}

	@boundMethod
	async update(req: RsRequest<Api.Destination.Req.Update>, res: RsResponse<Api.Destination.Res.Update>) {
		const result = await this.destinationService.update(req.data.id, req.data, WebUtils.getCompanyId(req));
		res.sendData(result);
	}

	@boundMethod
	@publicUrl('GET', '/destination/details')
	async getDetails(req: RsRequest<Api.Destination.Req.Details>, res: RsResponse<Api.Destination.Res.Details>) {
		const details: Api.Destination.Res.Details = await this.destinationService.getDetails(
			req.data,
			WebUtils.getCompanyId(req)
		);
		res.sendData(details);
	}

	@boundMethod
	@publicUrl('GET', '/destination/propertyType')
	async getPropertyTypes(
		req: RsRequest<Api.Destination.Req.PropertyType>,
		res: RsResponse<Api.Destination.Res.PropertyType[]>
	) {
		const propertyTypes = await this.destinationService.getPropertyTypes(req.data.destinationId);
		res.sendData(propertyTypes);
	}

	@boundMethod
	@publicUrl('GET', '/destination/allPropertyTypes')
	async getAllPropertyTypes(req: RsRequest<null>, res: RsResponse<Api.Destination.Res.PropertyType[]>) {
		const propertyTypes = await this.destinationService.getAllPropertyTypes();
		res.sendData(propertyTypes);
	}

	@boundMethod
	@publicUrl('GET', '/destination/availability')
	async getAvailable(
		req: RsRequest<Api.Destination.Req.Availability>,
		res: RsResponse<Api.Destination.Res.Availability[]>
	) {
		const pageDetails = this.pageFilterData(req.data);
		req.data = { ...req.data, ...pageDetails };
		const result = await this.destinationService.getAvailable(req.data, WebUtils.getCompanyId(req));
		res.sendPaginated(result.data, result.total);
	}
}
