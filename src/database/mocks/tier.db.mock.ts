import { DateUtils, ObjectUtils } from '../../utils/utils';
import ITierTable from '../interfaces/ITierTable';
import TableMock from './table.db.mock';

export default class TierTableMock extends TableMock implements ITierTable {
	columns: string[] = [
		'id',
		'companyId',
		'name',
		'description',
		'createdOn',
		'modifiedOn',
		'isActive',
		'accrualRate',
		'threshold',
		'isAnnualRate'
	];
	lastId: number;

	constructor(
		public readonly tiers: { [key: number]: Model.Tier },
		public readonly featureMaps: Model.TierFeatureMap[]
	) {
		super();
		this.lastId = Math.max(...Object.keys(tiers).map((k) => parseInt(k)));
	}

	async create(tierToCreate: Api.Tier.Req.Create): Promise<Model.Tier> {
		const newTier: Model.Tier = {
			...tierToCreate,
			id: ++this.lastId,
			isActive: 1,
			description: tierToCreate.description,
			isAnnualRate: tierToCreate.isAnnualRate,
			createdOn: DateUtils.dbNow(),
			modifiedOn: DateUtils.dbNow()
		};
		this.tiers[this.lastId] = newTier;
		return newTier;
	}
	async getById(tierId: number): Promise<Api.Tier.Res.Get> {
		const baseTier = this.tiers[tierId];
		return {
			...baseTier,
			features: [],
			mediaDetails: []
		};
	}
	async deleteFeaturesForTier(tierId: number): Promise<boolean> {
		ObjectUtils.pruneInPlace(this.featureMaps, (m) => m.tierId === tierId);
		return true;
	}
	async update(id: number, tableObj: any, companyId: number): Promise<Api.Tier.Res.Get> {
		const updated = {
			...this.tiers[id],
			...tableObj,
			id,
			companyId,
			modifiedOn: DateUtils.dbNow()
		};
		this.tiers[id] = updated;
		return this.getById(id);
	}
	async addFeature(tierId: number, featureIdList: number[]): Promise<any> {}

	async getAll(): Promise<Model.Tier[]> {
		return Object.values(this.tiers);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Model.Tier[]>> {
		// TODO: fix since tiers is an object
		// @ts-ignore
		return { total: Object.keys(this.tiers).length, data: this.tiers };
	}
	async delete(id: number, companyId: number): Promise<number> {
		delete this.tiers[id];
		return id;
	}

	getManyByIds: (objIds: readonly number[], companyId?: number) => Promise<any>;
	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	deleteMany: (ids: number[], companyId?: number) => Promise<any>;
}
