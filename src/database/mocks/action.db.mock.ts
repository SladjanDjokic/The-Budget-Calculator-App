import IActionTable, { BrandAndLocationAction } from '../interfaces/IActionTable';
import { DateUtils } from '../../utils/utils';
import RsPagedResponseData = RedSky.RsPagedResponseData;
import { ActionToCreate } from '../../services/action/IActionService';
import IBrandTable from '../interfaces/IBrandTable';
import TableMock from './table.db.mock';

export default class ActionTableMock extends TableMock implements IActionTable {
	actions: { [key: number]: Model.Action } = {};
	createCount = 0;
	constructor(private readonly brandTable: IBrandTable) {
		super();
	}
	columns: ['id', 'companyId', 'name', 'description', 'createdOn', 'modifiedOn', 'isActive', 'type', 'pointValue'];
	async create({ description, ...objToCreate }: ActionToCreate): Promise<Api.Action.Res.Get> {
		this.createCount++;
		const createId = Date.now();
		this.actions[createId] = {
			...objToCreate,
			description,
			id: createId,
			createdOn: DateUtils.dbNow(),
			modifiedOn: DateUtils.dbNow(),
			isActive: 1,
			brandId: null,
			brandLocationId: null
		};
		return this.getById(createId, objToCreate.companyId);
	}

	async update(actionId: number, objToUpdate: Api.Action.Req.Update): Promise<Api.Action.Res.Get> {
		for (let i in objToUpdate) {
			this.actions[actionId][i] = objToUpdate[i];
		}
		return this.getById(actionId, this.actions[actionId].companyId);
	}

	async getById(actionId: number, companyId: number): Promise<Api.Action.Res.Get> {
		const actionItem: Model.Action = this.actions[actionId];
		if (actionItem.companyId === companyId) {
			return {
				...actionItem,
				brand: await this.brandTable.getById(actionItem.brandId, companyId),
				brandLocation: null
			};
		}
		return null;
	}

	async getManyByIds(actionIdList: number[], companyId: number): Promise<Api.Action.Res.Get[]> {
		const returnActionList = [];
		for (let id of actionIdList) {
			const actionItem: Model.Action = this.actions[id];
			if (actionItem.companyId === companyId) returnActionList.push(this.actions[id]);
		}
		return returnActionList;
	}

	async getDetailsById(actionId: number, companyId: number): Promise<Api.Action.Res.Details> {
		const baseItem = await this.getById(actionId, companyId);
		return {
			...baseItem,
			campaigns: [
				{
					id: 1,
					segmentId: null,
					name: 'Test',
					description: 'Test',
					createdOn: null,
					modifiedOn: null,
					isActive: 1,
					maxReward: 100,
					type: 'REDEEMED',
					startOn: null,
					endOn: null,
					pointValueMultiplier: 1,
					campaignActionId: 1,
					actionCount: 1,
					activityReferenceNumber: null,
					completionPoints: 5000
				}
			]
		};
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId: number
	): Promise<RsPagedResponseData<Api.Action.Res.Get[]>> {
		// TODO: This code needs to be fixed. Before it was returning an object. This is incorrect. Needs to be an array.
		// @ts-ignore
		return { data: this.actions, total: this.createCount };
	}

	async delete(actionId: number, companyId: number): Promise<number> {
		const actionItem: Model.Action = this.actions[actionId];
		if (actionItem.companyId === companyId) {
			delete this.actions[actionId];
			return actionId;
		}
		return null;
	}

	async getBrandAndLocationActions(companyId: number): Promise<BrandAndLocationAction[]> {
		return;
	}

	updateMany: null;
	deleteMany: null;
}
