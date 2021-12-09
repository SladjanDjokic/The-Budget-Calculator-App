import { Service } from '../Service';
import IOrdersTable from '../../database/interfaces/IOrdersTable';
import IOrdersService from './IOrdersService';
import { ServiceName } from '../serviceFactory';
import RewardService from '../reward/reward.service';

export default class OrdersService extends Service implements IOrdersService {
	rewardService: RewardService;
	constructor(private readonly ordersTable: IOrdersTable) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.rewardService = services['RewardService'] as RewardService;
	}

	async getById(orderId: number): Promise<Api.Order.Res.Get> {
		return await this.ordersTable.getById(orderId);
	}

	async getByPage(
		{ pagination, sort, filter }: RedSky.PageQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Order.Res.Get[]>> {
		return await this.ordersTable.getByPage(pagination, sort, filter, companyId);
	}

	async getForUser(userId: number): Promise<Api.Order.Res.Get[]> {
		return await this.ordersTable.getForUser(userId);
	}

	async create(createDetails: Api.Order.Req.Create, userId: number): Promise<Api.Order.Res.Create> {
		const reward = await this.rewardService.getById(createDetails.rewardId);
		const orderToCreate = {
			...createDetails,
			priceDetail: JSON.stringify({ amountPoints: reward.pointCost }),
			userId
		};
		return await this.ordersTable.create(orderToCreate);
	}

	async update(orderDetails: Api.Order.Req.Update): Promise<Api.Order.Res.Update> {
		return this.ordersTable.update(orderDetails.id, orderDetails);
	}
}
