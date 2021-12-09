import ITable from '../ITable';

export default interface IRegionTable extends ITable {
	get: () => Promise<Api.Region.Res.Get[]>;
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	) => Promise<RedSky.RsPagedResponseData<Api.Region.Res.Detail[]>>;
	create: (regionToCreate: Api.Region.Req.Create) => Promise<Api.Region.Res.Detail>;
	update: (id: number, region: Omit<Api.Region.Req.Update, 'id'>) => Promise<Api.Region.Res.Detail>;
	delete: null;
	deleteMany: null;
}
