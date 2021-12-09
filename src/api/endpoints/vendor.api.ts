import { boundMethod } from 'autobind-decorator';
import { RsResponse } from '../../@types/expressCustom';
import { RsRequest } from '../../@types/expressCustom';
import serviceFactory from '../../services/serviceFactory';
import VendorService from '../../services/vendor/vendor.service';
import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import publicUrl from '../../@decorators/publicUrl';

export default class VendorApi extends GeneralApi {
	vendorService: VendorService;

	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.app.get(pre + '/paged', this.getByPage);

		this.vendorService = serviceFactory.get<VendorService>('VendorService');
	}

	@boundMethod
	@publicUrl('GET', '/vendor/paged')
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Vendor.Res.Get[]>) {
		let pageDetails = this.pageFilterData(req.data);
		let vendorResponse: RedSky.RsPagedResponseData<Api.Vendor.Res.Get[]> = await this.vendorService.getByPage(
			pageDetails.pagination,
			pageDetails.sort,
			pageDetails.filter
		);
		res.sendPaginated(vendorResponse.data, vendorResponse.total);
	}
}
