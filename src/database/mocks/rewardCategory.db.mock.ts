import IRewardCategoryTable from '../interfaces/IRewardCategoryTable';
import TableMock from './table.db.mock';

export default class RewardCategoryTableMock extends TableMock implements IRewardCategoryTable {
	columns: string[];
	getByIdCalls: number = 0;
	getByNameCalls: number = 0;
	getByPageCalls: number = 0;
	createCalls: number = 0;
	lastId: number;

	constructor(public readonly Categories: Api.Reward.Category.Res.Get[]) {
		super();
		this.lastId = Math.max(...Categories.map((c) => c.id));
	}

	async create(
		{ isActive, isFeatured, ...categoryDetails }: Api.Reward.Category.Req.Create,
		companyId: number
	): Promise<Api.Reward.Category.Res.Get> {
		this.createCalls++;
		const newCategory: Api.Reward.Category.Res.Get = {
			id: ++this.lastId,
			isActive,
			isFeatured,
			createdOn: new Date(),
			modifiedOn: new Date(),
			...categoryDetails,
			media: []
		};

		this.Categories.push(newCategory);
		return newCategory;
	}

	async getById(id: number): Promise<Api.Reward.Category.Res.Get> {
		return this.Categories.find((category) => {
			return category.id === id;
		});
	}

	async getManyByIds(ids: number[]): Promise<Api.Reward.Category.Res.Get[]> {
		return this.Categories.filter((category) => {
			if (ids.includes(category.id)) return category;
		});
	}

	async getByPage(): Promise<RedSky.RsPagedResponseData<Api.Reward.Category.Res.Get[]>> {
		return {
			total: this.Categories.length,
			data: this.Categories.map((c) => {
				return { ...c, media: [] };
			})
		};
	}

	async update(id: number, tableObj: Model.RewardCategory): Promise<Model.RewardCategory> {
		const index = this.Categories.findIndex((c) => c.id == id);
		this.Categories[index] = { ...this.Categories[index], ...tableObj };
		return this.Categories[index];
	}

	async deactivate(categoryId: number) {
		this.Categories.find((c) => c.id === categoryId).isActive = 0;
		return categoryId;
	}

	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	delete: null;
	deleteMany: null;
}
