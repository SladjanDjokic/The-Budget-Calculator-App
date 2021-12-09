import IRewardTable from '../interfaces/IRewardTable';
import TableMock from './table.db.mock';

export default class RewardTableMock extends TableMock implements IRewardTable {
	columns: string[];
	getByIdCalls: number = 0;
	getManyByIdsCalls: number = 0;
	getByCategoryCalls: number = 0;
	createCalls: number = 0;
	getByNameCalls: number = 0;
	private lastId: number;
	deactivateCalls: number = 0;

	constructor(public readonly Rewards: Model.Reward[], private readonly Maps: Model.RewardCategoryMap[]) {
		super();
		this.lastId = Math.max(...Rewards.map((r) => r.id));
	}

	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId: number
	) => Promise<RedSky.RsPagedResponseData<Api.Reward.Res.Get[]>>;

	customerGetByPage: (
		pagination: RedSky.PagePagination,
		vendorBrandIds: number[],
		vendorDestinationIds: number[],
		rewardCategoryIds: number[],
		minPointCost: number | null,
		maxPointCost: number | null,
		companyId: number
	) => Promise<RedSky.RsPagedResponseData<Api.Reward.Res.Get[]>>;

	async create(newReward: Model.Reward): Promise<Model.Reward> {
		this.createCalls++;
		this.lastId++;
		newReward.id = this.lastId;
		this.Rewards.push(newReward);
		return newReward;
	}

	async deactivate(rewardId: number, companyId: number): Promise<number> {
		this.deactivateCalls++;
		const indexToDeactivate: number = this.Rewards.findIndex((r) => r.id === rewardId && r.companyId === companyId);
		this.Rewards[indexToDeactivate].isActive = 0;
		return rewardId;
	}

	async updateActiveStatus(rewardId: number, companyId: number): Promise<number> {
		this.deactivateCalls++;
		const indexToToggle: number = this.Rewards.findIndex((r) => r.id === rewardId && r.companyId === companyId);
		this.Rewards[indexToToggle].isActive = this.Rewards[indexToToggle].isActive === 0 ? 1 : 0;
		return rewardId;
	}

	async getById(rewardId: number, companyId: number): Promise<Api.Reward.Res.Get> {
		this.getByIdCalls++;
		const RewardModel = this.Rewards.find((r) => r.companyId === companyId && r.id === rewardId);
		if (!!!RewardModel) return null;
		const categoryIds: number[] = this.Maps.filter((m) => {
			return m.rewardId === rewardId;
		}).map((m) => m.categoryId);
		return {
			...RewardModel,
			categoryIds,
			vendorName: '',
			vouchers: [],
			media: []
		};
	}

	async getManyByIds(RewardIds: number[], companyId: number): Promise<Model.Reward[]> {
		this.getManyByIdsCalls++;
		return this.Rewards.filter((p) => p.companyId === companyId && RewardIds.includes(p.id));
	}

	async getRewardOnly(rewardId: number, companyId: number): Promise<Model.Reward> {
		return this.Rewards.find((reward) => reward.id === rewardId);
	}

	async update(id: number, tableObj: Api.Reward.Req.Update, companyId: number): Promise<Api.Reward.Res.Update> {
		const index = this.Rewards.findIndex((r) => r.id === id && r.companyId === companyId);
		delete tableObj.id;
		const updatedObject = { ...this.Rewards[index], ...tableObj };
		this.Rewards[index] = updatedObject;
		return this.getById(updatedObject.id, companyId);
	}
	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	delete: null;
	deleteMany: null;
}
