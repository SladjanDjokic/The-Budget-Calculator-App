import IService from '../IService';

export default interface IUserAddressService extends IService {
	create: (userAddressObj: Api.UserAddress.Req.Create) => Promise<Model.UserAddress>;
	getById: (userAddressId: number) => Promise<Model.UserAddress>;
	getManyByIds: (userAddressList: number[]) => Promise<Model.UserAddress[]>;
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	) => Promise<RedSky.RsPagedResponseData<Model.UserAddress>>;
	update: (userAddressId: number, userAddressObj: Api.UserAddress.Req.Update) => Promise<Model.UserAddress>;
	delete: (userAddressId: number) => Promise<number>;
}
