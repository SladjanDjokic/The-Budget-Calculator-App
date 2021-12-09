import chai from 'chai';
import ActionService from '../../services/action/action.service';
import actionResource from '../resources/action.service.resource';

describe('ActionService', function () {
	let action: Api.Action.Res.Get;
	const actionService = new ActionService(actionResource.actionTable);

	describe('Create Actions', function () {
		it('should create a system action', async function () {
			const createdAction: Api.Action.Res.Get = await actionService.create({
				...actionResource.actionCreate,
				companyId: actionResource.companyId
			});
			chai.expect(createdAction).to.exist;
			chai.expect(createdAction).to.haveOwnProperty('id');
			action = createdAction;
		});
	});

	describe('Update Action', function () {
		it('should update a system action', async function () {
			const updatedAction: Api.Action.Res.Get = await actionService.update(
				action.id,
				{
					...actionResource.actionUpdate,
					id: action.id
				},
				actionResource.companyId
			);
			chai.expect(updatedAction).to.exist;
			chai.expect(updatedAction.description).to.not.equal(actionResource.actionCreate.description);
			chai.expect(updatedAction.pointValue).to.equal(actionResource.actionUpdate.pointValue);
		});
	});

	describe('Get Action', function () {
		it('should get an action by its id', async function () {
			const localAction: Api.Action.Res.Get = await actionService.getById(action.id, actionResource.companyId);
			chai.expect(localAction).to.exist;
		});
		it('should get an action by id list', async function () {
			const localActions: Api.Action.Res.Get[] = await actionService.getManyByIds(
				[action.id],
				actionResource.companyId
			);
			chai.expect(localActions).to.exist;
			chai.expect(localActions).to.be.an('array');
			chai.expect(localActions.length).to.equal(1);
		});
		it('should get actions by page', async function () {
			const pagedActions: RedSky.RsPagedResponseData<Api.Action.Res.Get> = await actionService.getByPage(
				actionResource.pagination,
				actionResource.sort,
				actionResource.filter,
				actionResource.companyId
			);
			chai.expect(pagedActions).to.exist;
			chai.expect(pagedActions).to.haveOwnProperty('data');
			chai.expect(pagedActions).to.haveOwnProperty('total');
			chai.expect(pagedActions.total).to.equal(1);
		});
	});

	describe('Delete Action', function () {
		it('should delete an action by id', async function () {
			const deletedActionId: number = await actionService.delete(action.id, actionResource.companyId);
			chai.expect(deletedActionId).to.exist;
			chai.expect(deletedActionId).to.equal(action.id);
		});
	});
});
