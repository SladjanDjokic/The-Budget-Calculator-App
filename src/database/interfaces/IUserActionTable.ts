import ITable from '../ITable';

export interface UserActionCreate {
	userId: number;
	campaignActionId: number;
}

export default interface IUserActionTable extends ITable {
	createMany: (userId: number, campaignActionIds: number[]) => Promise<Model.UserAction[]>;
	getByUserId: (userId: number) => Promise<Model.UserAction[]>;
	updateManyForUser: (userId: number, userActionIds: number[]) => Promise<Model.UserAction[]>;
	refundUserAction: (userActionId: number) => Promise<Model.UserAction>;
}
