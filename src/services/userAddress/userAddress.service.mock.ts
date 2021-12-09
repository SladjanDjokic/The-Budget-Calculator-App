import IUserAddressService from './IUserAddressService';
import IUserAddressTable from '../../database/interfaces/IUserAddressTable';

export default class UserAddressServiceMock implements IUserAddressService {
	constructor(private readonly userAddressMockTable: IUserAddressTable) {}
	start() {}

	create(userAddressObj: Api.UserAddress.Req.Create): Promise<Model.UserAddress> {
		return this.userAddressMockTable.create(userAddressObj);
	}

	getById(userAddressId: number): Promise<Model.UserAddress> {
		return this.userAddressMockTable.getById(userAddressId);
	}

	getManyByIds(userAddressList: number[]): Promise<Model.UserAddress[]> {
		return this.userAddressMockTable.getManyByIds(userAddressList);
	}

	getByPage(pagination: RedSky.PagePagination, sort: RedSky.SortQuery, filter: RedSky.FilterQuery) {
		return this.userAddressMockTable.getByPage(pagination, sort, filter);
	}

	update(userAddressId: number, userAddressObj: Api.UserAddress.Req.Update): Promise<Model.UserAddress> {
		return this.userAddressMockTable.update(userAddressId, userAddressObj);
	}

	async delete(userAddressId: number): Promise<number> {
		await this.userAddressMockTable.delete(userAddressId);
		return userAddressId;
	}
}
