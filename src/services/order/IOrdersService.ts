import IService from '../IService';

export default interface IOrdersService extends IService {
	getById: (orderId: number) => Promise<Api.Order.Res.Get>;
	getByPage: (
		{ pagination, sort, filter }: RedSky.PageQuery,
		companyId?: number
	) => Promise<RedSky.RsPagedResponseData<Api.Order.Res.Get[]>>;
	getForUser: (userId: number) => Promise<Api.Order.Res.Get[]>;
	create: (createDetails: Api.Order.Req.Create, userId: number) => Promise<Api.Order.Res.Create>;
	update: (orderDetails: Api.Order.Req.Update) => Promise<Api.Order.Res.Update>;
}
