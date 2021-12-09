import ITable from '../ITable';

export default interface IRewardTable extends ITable {
	getById: (RewardId: number, companyId?: number) => Promise<Api.Reward.Res.Get>;
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	) => Promise<RedSky.RsPagedResponseData<Api.Reward.Res.Get[]>>;
	customerGetByPage: (
		pagination: RedSky.PagePagination,
		vendorBrandIds: number[],
		vendorDestinationIds: number[],
		rewardCategoryIds: number[],
		minPointCost: number | null,
		maxPointCost: number | null,
		companyId?: number
	) => Promise<RedSky.RsPagedResponseData<Api.Reward.Res.Get[]>>;
	getRewardOnly: (rewardId: number, companyId?: number) => Promise<Model.Reward>;
	update: (rewardId: number, updates: Partial<Model.Reward>, companyId?: number) => Promise<Api.Reward.Res.Update>;
	deactivate: (rewardId: number, companyId: number) => Promise<number>;
	updateActiveStatus: (rewardId: number, companyId?: number) => Promise<number>;
	delete: null;
	deleteMany: null;
}
