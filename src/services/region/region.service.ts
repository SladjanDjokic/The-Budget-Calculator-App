import { Service } from '../Service';
import IRegionTable from '../../database/interfaces/IRegionTable';
import { ServiceName } from '../serviceFactory';

export default class RegionService extends Service {
	constructor(private readonly regionTable: IRegionTable) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {}

	async get(): Promise<Api.Region.Res.Get[]> {
		return this.regionTable.get();
	}

	getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	): Promise<RedSky.RsPagedResponseData<Api.Region.Res.Detail[]>> {
		return this.regionTable.getByPage(pagination, sort, filter);
	}

	create(regionToCreate: Api.Region.Req.Create): Promise<Api.Region.Res.Get> {
		return this.regionTable.create(regionToCreate);
	}

	update({ id, ...region }: Api.Region.Req.Update): Promise<Api.Region.Res.Get> {
		return this.regionTable.update(id, region);
	}
}
