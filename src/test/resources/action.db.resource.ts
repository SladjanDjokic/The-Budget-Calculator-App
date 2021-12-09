import { ActionToCreate } from '../../services/action/IActionService';

const companyId = 1;
let actionWithBrandId: number;
let actionWithoutBrandId: number;
const brandId = 1;
const brandLocationId = 1;
const updateRequest: Api.Action.Req.Update = {
	id: actionWithoutBrandId
};
const createActionRequest: ActionToCreate = {
	companyId,
	name: 'Test Action',
	description: 'test description',
	isActive: 1,
	pointValue: 100,
	type: 'test type'
};
const actionTableResource = {
	companyId,
	actionWithBrandId,
	actionWithoutBrandId,
	updateRequest,
	brandId,
	brandLocationId,
	createActionRequest
};

export default actionTableResource;
