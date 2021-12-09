import ITable from '../ITable';

export default interface IUserPermissionTable extends ITable {
	deleteForUser(userId: number);
	delete: null;
	deleteMany: null;
}
