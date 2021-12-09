import IOrdersService from './IOrdersService';
import { ServiceName } from '../serviceFactory';
import { Service } from '../Service';

export default class OrdersServiceMock implements IOrdersService {
	start(services: Partial<Record<ServiceName, Service>>): void {}

	create(createDetails: Api.Order.Req.Create, userId: number): Promise<Api.Order.Res.Create> {
		return Promise.resolve(undefined);
	}

	getById(orderId: number): Promise<Api.Order.Res.Get> {
		return Promise.resolve(undefined);
	}

	getByPage(
		{ pagination, sort, filter }: RedSky.PageQuery,
		companyId: number | undefined
	): Promise<RedSky.RsPagedResponseData<Api.Order.Res.Get[]>> {
		return Promise.resolve(undefined);
	}

	getForUser(userId: number): Promise<Api.Order.Res.Get[]> {
		return Promise.resolve([]);
	}

	update(orderDetails: Api.Order.Req.Update): Promise<Api.Order.Res.Update> {
		return Promise.resolve(undefined);
	}
}
