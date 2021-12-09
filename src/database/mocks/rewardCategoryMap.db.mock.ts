import { ObjectUtils } from '../../utils/utils';
import IRewardCategoryMapTable from '../interfaces/IRewardCategoryMapTable';
import TableMock from './table.db.mock';

export default class RewardCategoryMapTableMock extends TableMock implements IRewardCategoryMapTable {
	columns: string[];
	createCalls: number = 0;
	deleteByRewardIdCalls: number = 0;

	constructor(public readonly Maps: Model.RewardCategoryMap[]) {
		super();
	}

	async deleteByRewardId(rewardId: number): Promise<void> {
		this.deleteByRewardIdCalls++;
		ObjectUtils.pruneInPlace(this.Maps, (m) => !(m.rewardId === rewardId));
	}

	getMaps() {
		return this.Maps;
	}

	async create(tableObj: Model.RewardCategoryMap): Promise<boolean> {
		this.createCalls++;
		this.Maps.push(tableObj);
		return true;
	}

	getById: (objId: number, companyId?: number) => Promise<any>;
	getManyByIds: (objIds: readonly number[], companyId?: number) => Promise<any>;
	update: (id: number, tableObj: any) => Promise<any>;
	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	) => Promise<any>;
	delete: (id: number, companyId?: number) => Promise<number>;
	deleteMany: (ids: number[], companyId?: number) => Promise<any>;
}
