import { UserPointCreate } from '../../services/userPoint/IUserPointService';

const userPointCreate: UserPointCreate = {
	pointType: 'BOOKING',
	pointAmount: 10000,
	status: 'PENDING',
	userId: 0,
	reason: 'HOTEL_STAY',
	reservationId: 54
};

const userPoint: Model.UserPoint = {
	availableOn: undefined,
	campaignId: undefined,
	campaignActionId: 0,
	createdOn: undefined,
	description: '',
	expireOn: undefined,
	id: 0,
	modifiedOn: undefined,
	notes: '',
	orderId: 0,
	pointAmount: 5000,
	pointType: 'BOOKING',
	reason: 'HOTEL_STAY',
	reservationId: 0,
	rewardVoucherId: 0,
	status: 'PENDING',
	userActionId: 0,
	userId: 0
};

const pagination: RedSky.PagePagination = {
	page: 1,
	perPage: 1
};

const sort: RedSky.SortQuery = {
	field: 'id',
	order: 'ASC'
};

const filter: RedSky.FilterQuery = {
	matchType: 'like',
	searchTerm: []
};

const userPointResource = {
	companyId: 1,
	userPointCreate,
	pagination,
	sort,
	filter,
	userPoint
};
export default userPointResource;
