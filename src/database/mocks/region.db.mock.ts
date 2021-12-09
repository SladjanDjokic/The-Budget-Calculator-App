import IRegionTable from '../interfaces/IRegionTable';
import TableMock from './table.db.mock';

export default class RegionTableMock extends TableMock implements IRegionTable {
	regionList: Api.Region.Res.Get[] = [];
	constructor(public readonly regions: Model.Region[]) {
		super();
		this.regionList = regions;
	}

	create(regionToCreate: Api.Region.Req.Create): Promise<Api.Region.Res.Detail> {
		const id = this.regionList.length + 1;
		const createdRegion: Api.Region.Res.Detail = { id, name: regionToCreate.name, isActive: 1 };
		this.regionList.push(createdRegion);
		return Promise.resolve(createdRegion);
	}

	get(): Promise<Api.Region.Res.Get[]> {
		return Promise.resolve(this.regionList);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	): Promise<any> {
		return super.getByPage(pagination, sort, filter);
	}

	delete: null;
	deleteMany: null;
}
