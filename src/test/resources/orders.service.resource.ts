import OrdersTableMock from '../../database/mocks/orders.db.mock';

const userId = 1;
const ordersTableMock = new OrdersTableMock([
	{
		id: 1,
		userId: 1,
		rewardId: 1,
		status: 'PENDING',
		createdOn: new Date(),
		modifiedOn: new Date(),
		paymentMethodId: 2,
		priceDetail: '',
		pointCost: 500,
		name: '',
		type: ''
	},
	{
		id: 2,
		userId: 1,
		rewardId: 1,
		status: 'COMPLETED',
		createdOn: new Date(),
		modifiedOn: new Date(),
		paymentMethodId: 2,
		priceDetail: '',
		pointCost: 500,
		name: '',
		type: ''
	},
	{
		id: 3,
		userId: 2,
		rewardId: 1,
		status: 'PENDING',
		createdOn: new Date(),
		modifiedOn: new Date(),
		paymentMethodId: 2,
		priceDetail: '',
		pointCost: 500,
		name: '',
		type: ''
	},
	{
		id: 4,
		userId: 3,
		rewardId: 1,
		status: 'PENDING',
		createdOn: new Date(),
		modifiedOn: new Date(),
		paymentMethodId: 2,
		priceDetail: '',
		pointCost: 500,
		name: '',
		type: ''
	}
]);

const ordersResource = {
	userId,
	ordersTableMock
};

export default ordersResource;
