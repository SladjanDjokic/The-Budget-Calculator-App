import { Service } from '../Service';
import UserService from '../user/user.service';
import { ServiceName } from '../serviceFactory';
import IUserAddressService from './IUserAddressService';

export default class UserAddressService extends Service implements IUserAddressService {
	userService: UserService;
	constructor(readonly userAddressTable) {
		super();
	}
	start(services: Partial<Record<ServiceName, Service>>) {
		this.userService = services['UserService'] as UserService;
	}

	async create(userAddressObj: Api.UserAddress.Req.Create): Promise<Model.UserAddress> {
		const userAddress: Model.UserAddress = await this.userAddressTable.create(userAddressObj);
		this.userService.flushUserFromCache(userAddress.userId);
		return userAddress;
	}

	getById(userAddressId: number): Promise<Model.UserAddress> {
		return this.userAddressTable.getById(userAddressId);
	}

	getManyByIds(userAddressList: number[]): Promise<Model.UserAddress[]> {
		return this.userAddressTable.getManyByIds(userAddressList);
	}

	getByPage(pagination: RedSky.PagePagination, sort: RedSky.SortQuery, filter: RedSky.FilterQuery) {
		return this.userAddressTable.getByPage(pagination, sort, filter);
	}

	async update(userAddressId: number, userAddressObj: Api.UserAddress.Req.Update): Promise<Model.UserAddress> {
		const updatedAddress: Model.UserAddress = await this.userAddressTable.update(userAddressId, userAddressObj);
		this.userService.flushUserFromCache(updatedAddress.userId);
		return updatedAddress;
	}

	async delete(userAddressId: number): Promise<number> {
		const userAddress: Model.UserAddress = await this.getById(userAddressId);
		await this.userAddressTable.delete(userAddressId);
		this.userService.flushUserFromCache(userAddress.userId);
		return userAddressId;
	}
}
