import IVendorView from '../../database/interfaces/IVendorView';
import { Service } from '../Service';
import { ServiceName } from '../serviceFactory';

export default class VendorService extends Service {
	constructor(private readonly vendorView: IVendorView) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {}

	getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	): Promise<RedSky.RsPagedResponseData<Api.Vendor.Res.Get[]>> {
		return this.vendorView.getByPage(pagination, sort, filter);
	}
}
