import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { boundMethod } from 'autobind-decorator';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import UserService from '../../services/user/user.service';
import serviceFactory from '../../services/serviceFactory';
import publicUrl from '../../@decorators/publicUrl';

export default class CustomerApi extends GeneralApi {
	userService: UserService;
	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.userService = serviceFactory.get<UserService>('UserService');
		this.app.post(`${pre}`, this.create);
		this.app.get(pre, this.get);
	}

	@boundMethod
	@publicUrl('POST', '/customer')
	async create(req: RsRequest<Api.Customer.Req.Create>, res: RsResponse<Api.Customer.Res.Create>) {
		const createdUser = await this.userService.createCustomer(req.data, req.hostname);
		res.sendData(createdUser);
	}

	@boundMethod
	async get(req: RsRequest<Api.Customer.Req.Get>, res: RsResponse<Api.Customer.Res.Get>) {
		const customer = await this.userService.getUserDetails(req.user.id);
		res.sendData(customer);
	}
}
