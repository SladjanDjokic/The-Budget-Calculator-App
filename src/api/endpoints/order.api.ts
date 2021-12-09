import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import serviceFactory from '../../services/serviceFactory';
import { boundMethod } from 'autobind-decorator';
import OrdersService from '../../services/order/orders.service';
import publicUrl from '../../@decorators/publicUrl';
import roleAuthorization from '../../@decorators/roleAuthorization';

export default class OrderApi extends GeneralApi {
	ordersService: OrdersService;
	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.app.get(pre, this.getById);
		this.app.get(`${pre}/paged`, this.getByPage);
		this.app.get(`${pre}/user`, this.getForUser);
		this.app.post(pre, this.create);
		this.app.put(pre, this.update);

		this.ordersService = serviceFactory.get<OrdersService>('OrdersService');
	}

	@boundMethod
	@publicUrl('GET', '/order/')
	async getById(req: RsRequest<Api.Order.Req.Get>, res: RsResponse<Api.Order.Res.Get>) {
		const order: Api.Order.Res.Get = await this.ordersService.getById(req.data.id);
		res.sendData(order);
	}

	@boundMethod
	@publicUrl('GET', '/order/paged')
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Order.Res.Get[]>) {
		let pageDetails: RedSky.PageQuery = this.pageFilterData(req.data);
		const pagedResult: RedSky.RsPagedResponseData<Api.Order.Res.Get[]> = await this.ordersService.getByPage(
			pageDetails
		);
		res.sendPaginated(pagedResult.data, pagedResult.total);
	}

	@boundMethod
	@publicUrl('GET', '/order/user')
	async getForUser(req: RsRequest<Api.Order.Req.User>, res: RsResponse<Api.Order.Res.Get[]>) {
		const orders: Api.Order.Res.Get[] = await this.ordersService.getForUser(req.data.userId);
		res.sendData(orders);
	}

	@boundMethod
	async create(req: RsRequest<Api.Order.Req.Create>, res: RsResponse<Api.Order.Res.Create>) {
		const createdOrder: Api.Order.Res.Create = await this.ordersService.create(
			{
				...req.data
			},
			req.user.id
		);
		res.sendData(createdOrder);
	}

	@boundMethod
	@roleAuthorization('self', 'admin')
	async update(req: RsRequest<Api.Order.Req.Update>, res: RsResponse<Api.Order.Res.Update>) {
		const updatedOrder: Api.Order.Res.Update = await this.ordersService.update(req.data);
		res.sendData(updatedOrder);
	}
}
