import { DateUtils, ObjectUtils } from '../../utils/utils';
import ITierFeatureTable from '../interfaces/ITierFeatureTable';
import TableMock from './table.db.mock';

export default class TierFeatureTableMock extends TableMock implements ITierFeatureTable {
	columns: string[];
	lastId: number = 0;
	constructor(public readonly features: { [key: number]: Model.TierFeature }) {
		super();
		this.lastId = Math.max(...Object.keys(features).map((f) => parseInt(f)));
	}
	async create(featureToCreate: Api.Tier.Req.CreateFeature): Promise<Model.TierFeature> {
		const newFeature: Model.TierFeature = {
			...featureToCreate,
			id: ++this.lastId,
			createdOn: DateUtils.dbNow(),
			modifiedOn: DateUtils.dbNow()
		};
		this.features[this.lastId] = newFeature;
		return newFeature;
	}
	async update(id: number, tableObj: any): Promise<Api.Tier.Res.GetFeature> {
		const updatedFeature = {
			...this.features[id],
			...tableObj,
			modifiedOn: DateUtils.dbNow()
		};
		this.features[id] = updatedFeature;
		return this.getById(id);
	}
	async getById(objId: number): Promise<Api.Tier.Res.GetFeature> {
		return this.features[objId];
	}
	async getAll(): Promise<Model.TierFeature[]> {
		return ObjectUtils.toArray(this.features);
	}
	getManyByIds: (objIds: readonly number[]) => Promise<any>;
	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	) => Promise<any>;
	async delete(id: number): Promise<number> {
		delete this.features[id];
		return id;
	}
	deleteMany: (ids: number[], companyId?: number) => Promise<any>;
}
