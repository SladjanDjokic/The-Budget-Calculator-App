import { ActionToCreate } from '../../services/action/IActionService';
import ActionTableMock from '../../database/mocks/action.db.mock';
import BrandTableMock from '../../database/mocks/brand.db.mock';

const companyId = 1;
const actionTable = new ActionTableMock(new BrandTableMock([]));

const actionCreate: ActionToCreate = {
	companyId,
	name: 'Test Action',
	description: 'Its a new action',
	isActive: 1,
	type: 'POINT_VALUE',
	pointValue: 50
};

const actionUpdate: Omit<Api.Action.Req.Update, 'id'> = {
	description: 'Update action details',
	pointValue: 100
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
	matchType: 'exact',
	searchTerm: []
};

const actionResource = {
	companyId,
	actionTable,
	actionCreate,
	actionUpdate,
	pagination,
	sort,
	filter
};

export default actionResource;
