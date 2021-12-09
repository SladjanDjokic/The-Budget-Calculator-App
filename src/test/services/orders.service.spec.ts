import chai, { expect } from 'chai';
import ordersResource from '../resources/orders.service.resource';
import OrdersService from '../../services/order/orders.service';

describe('Orders Service', function () {
	let ordersService: OrdersService;
	let orders: Api.Order.Res.Get[];

	before(() => {
		ordersService = new OrdersService(ordersResource.ordersTableMock);
	});

	describe('Get Orders For User', function () {
		it('Should get a list of orders for user', async function () {
			orders = await ordersService.getForUser(ordersResource.userId);
			expect(orders).to.exist;
			expect(orders).to.be.an('array').with.length.greaterThan(0);
			expect(orders[0]).to.haveOwnProperty('userId').that.equals(ordersResource.userId);
		});
	});
});
