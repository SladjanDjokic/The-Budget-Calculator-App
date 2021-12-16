import IUserBusinessTable from '../interfaces/IUserBusinessTable';
import TableMock from './table.db.mock';

export default class UserBusinessTableMock extends TableMock implements IUserBusinessTable {
	createCount = 0;
	lastId = 0;

	constructor(private userBusiness: Model.UserBusiness[] = []) {
		super();
	}

	columns: [
		'id',
		'companyId',
		'destinationId',
		'brandId',
		'brandLocationId',
		'createdOn',
		'creatingUserId',
		'revokedOn',
		'revokedUserId'
	];

	async create(data: Api.UserBusiness.Req.Create): Promise<Model.UserBusiness> {
		this.createCount++;
		const createdUserBusiness: Model.UserBusiness = {
			id: ++this.lastId,
			...data
		};
		this.userBusiness.push(createdUserBusiness);
		return createdUserBusiness;
	}

	async getByUserId(userId: number): Promise<Model.UserBusiness[]> {
		return this.userBusiness.filter((business) => business.userId === userId);
	}
}
