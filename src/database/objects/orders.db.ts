import Table from '../Table';
import IOrdersTable from '../interfaces/IOrdersTable';
import { ObjectUtils } from '../../utils/utils';
import mysql from 'mysql';

export default class Orders extends Table implements IOrdersTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	getById(orderId): Promise<Api.Order.Res.Get> {
		return this.db.queryOne(
			`${Orders.orderDetailSelect} 
										FROM orders
											LEFT JOIN reward ON reward.id = orders.rewardId
										WHERE orders.id = ?`,
			[orderId]
		);
	}

	getForUser(userId: number): Promise<Api.Order.Res.Get[]> {
		return this.db.runQuery(
			`${Orders.orderDetailSelect} 
										FROM orders 
											LEFT JOIN reward ON reward.id = orders.rewardId
										WHERE userId = ?`,
			[userId]
		);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Order.Res.Get[]>> {
		const companyQuery = companyId ? mysql.format('reward.companyId = ? AND ', [companyId]) : '';
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		let allObjects = await this.db.runQuery(
			`${Orders.orderDetailSelect}
       				FROM orders
						LEFT JOIN reward ON reward.id = orders.rewardId
			 WHERE 
		     ${companyQuery}
			 ${pageQuery.filterQuery}
			 ${pageQuery.sortQuery} 
			 LIMIT ?
			 OFFSET ?; 
				SELECT Count(orders.id) as total FROM orders
					LEFT JOIN reward ON reward.id = orders.rewardId
                    WHERE ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	private static readonly orderDetailSelect = `SELECT
       				orders.*,
					reward.name as name,
       				reward.pointCost`;
}

export const orders = (dbArgs) => {
	dbArgs.tableName = 'orders';
	return new Orders(dbArgs);
};
