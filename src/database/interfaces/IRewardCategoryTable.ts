import ITable from '../ITable';

export default interface IRewardCategoryTable extends ITable {
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId: number
	) => Promise<RedSky.RsPagedResponseData<Api.Reward.Category.Res.Get[]>>;
	getById: (id: number) => Promise<Api.Reward.Category.Res.Get>;
	getManyByIds: (ids: number[]) => Promise<Api.Reward.Category.Res.Get[]>;
	deactivate: (categoryId: number) => Promise<number>;
	delete: null;
	deleteMany: null;
}
