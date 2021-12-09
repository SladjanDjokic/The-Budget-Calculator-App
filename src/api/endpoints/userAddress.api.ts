import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import { RsError } from '../../utils/errors';
import serviceFactory from '../../services/serviceFactory';
import UserAddressService from '../../services/userAddress/userAddress.service';
import accessScopes from '../../@decorators/accessScopes';
import { boundMethod } from 'autobind-decorator';
import roleAuthorization from '../../@decorators/roleAuthorization';

export default class UserAddressApi extends GeneralApi {
	userAddressService: UserAddressService;
	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.userAddressService = serviceFactory.get('UserAddressService');

		this.app.post(pre, this.create);
		this.app.get(pre, this.get);
		this.app.get(`${pre}/paged`, this.getByPage);
		this.app.put(pre, this.update);
		this.app.delete(pre, this.delete);
	}

	@boundMethod
	@roleAuthorization('self', 'admin')
	@accessScopes('USER')
	async create(req: RsRequest<Api.UserAddress.Req.Create>, res: RsResponse<Api.UserAddress.Res.Get>) {
		let userAddress = this.getCreateObjectFromRequest(req, this.userAddressService.userAddressTable.columns);
		userAddress.userId = req.data.userId || req.user.id;
		let createdObj = ((await this.userAddressService.create(userAddress)) as unknown) as Api.UserAddress.Res.Get;
		res.sendData(createdObj);
	}

	@boundMethod
	async get(
		req: RsRequest<Api.UserAddress.Req.Get>,
		res: RsResponse<Api.UserAddress.Res.Get | Api.UserAddress.Res.Get[]>
	) {
		if (req.data.id) {
			let obj = ((await this.userAddressService.getById(req.data.id)) as unknown) as Api.UserAddress.Res.Get;
			res.sendData(obj);
		} else if (req.data.ids) {
			let objs = await this.userAddressService.getManyByIds(req.data.ids);
			res.sendData(objs);
		} else throw new RsError('BAD_REQUEST', 'Missing id or ids');
	}

	@boundMethod
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.UserAddress.Res.Get[]>) {
		let pageDetails = this.pageFilterData(req.data);
		let userPagedResponse: RedSky.RsPagedResponseData<
			Api.UserAddress.Res.Get[]
		> = await this.userAddressService.getByPage(pageDetails.pagination, pageDetails.sort, pageDetails.filter);
		res.sendPaginated(userPagedResponse.data, userPagedResponse.total);
	}

	@boundMethod
	@roleAuthorization('self', 'admin')
	@accessScopes('USER')
	async update(req: RsRequest<Api.UserAddress.Req.Update>, res: RsResponse<Api.UserAddress.Res.Get>) {
		let updatedObjResponse = await this.userAddressService.update(req.data.id, req.data);
		res.sendData(updatedObjResponse);
	}

	@boundMethod
	@roleAuthorization('self', 'admin')
	@accessScopes('USER')
	async delete(req: RsRequest<Api.UserAddress.Req.Delete>, res: RsResponse<number>) {
		let deletedObjIdResponse = await this.userAddressService.delete(req.data.id);
		res.sendData(deletedObjIdResponse);
	}
}
