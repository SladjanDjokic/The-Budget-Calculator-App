import ITable from '../ITable';

export default interface IUserBusinessTable extends ITable {
	create: (data: Api.UserBusiness.Req.Create) => Promise<Model.UserBusiness>;
	getByUserId: (userId: number) => Promise<Model.UserBusiness[]>;
}
