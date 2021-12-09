import IUserActionTable, { UserActionCreate } from '../interfaces/IUserActionTable';
import { DateUtils } from '../../utils/utils';
import TableMock from './table.db.mock';

export default class UserActionTableMock extends TableMock implements IUserActionTable {
	columns: string[];
	createCalls = 0;
	id = 0;

	constructor(private userActions: Model.UserAction[] = []) {
		super();

		userActions.forEach((action) => {
			if (action.id > this.id) {
				this.id = action.id;
			}
		});
	}

	async create(tableObj: UserActionCreate): Promise<Model.UserAction> {
		const createdUserAction: Model.UserAction = {
			...tableObj,
			id: ++this.id,
			createdOn: DateUtils.dbNow(),
			modifiedOn: DateUtils.dbNow(),
			hasAwarded: 0,
			refundedOn: null
		};
		this.userActions.push(createdUserAction);
		return createdUserAction;
	}
	async createMany(userId: number, campaignActionIds: number[]): Promise<Model.UserAction[]> {
		const response: Model.UserAction[] = [];
		for (let campaignActionId of campaignActionIds) {
			const id = ++this.id;
			this.userActions[id] = {
				id,
				userId,
				campaignActionId,
				createdOn: DateUtils.dbNow(),
				modifiedOn: DateUtils.dbNow(),
				hasAwarded: 0,
				refundedOn: null
			};
			response.push(this.userActions[id]);
		}
		return response;
	}
	async getById(objId: number): Promise<Model.UserAction> {
		return this.userActions.find((userAction) => userAction.id === objId);
	}
	async getByUserId(userId: number): Promise<Model.UserAction[]> {
		const actions = this.userActions.filter((userAction) => userAction.userId === userId);
		return actions;
	}
	async updateManyForUser(userId: number, userActionIds: number[]): Promise<Model.UserAction[]> {
		const userActions: Model.UserAction[] = [];
		this.userActions.forEach((userAction) => {
			if (userAction.userId === userId && userActionIds.includes(userAction.id)) {
				userAction.hasAwarded = 1;
				userActions.push(userAction);
			}
		});
		return userActions;
	}
	async refundUserAction(userActionId: number): Promise<Model.UserAction> {
		const index = this.userActions.findIndex((action) => action?.id === userActionId);
		this.userActions[index].refundedOn = new Date();
		return this.userActions[index];
	}
	getManyByIds: (objIds: readonly number[], companyId?: number) => Promise<any>;
	update: (id: number, tableObj: any, companyId?: number) => Promise<any>;
	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	) => Promise<any>;
	delete: (id: number, companyId?: number) => Promise<number>;
	deleteMany: (ids: number[], companyId?: number) => Promise<any>;
}
