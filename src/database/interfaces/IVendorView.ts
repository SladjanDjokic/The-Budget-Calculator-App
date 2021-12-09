import ITable from '../ITable';

export default interface IVendorView extends ITable {
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	) => Promise<RedSky.RsPagedResponseData<Api.Vendor.Res.Get[]>>;
	delete: null;
	deleteMany: null;
}
