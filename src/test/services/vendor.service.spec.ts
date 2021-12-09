import chai from 'chai';
import dbSingleton from '../../database/dbSingleton';
import VendorService from '../../services/vendor/vendor.service';
import { ObjectUtils } from '../../utils/utils';
import VendorServiceResource, { Resource as originalResource } from '../resources/vendor.service.resource';
const expect = chai.expect;

describe('Vendor Service', () => {
	let localResource: VendorServiceResource;
	let vendorService: VendorService;

	function initialize() {
		localResource = ObjectUtils.clone(originalResource);
		vendorService = new VendorService(localResource.vendorView);
	}

	describe('Get vendors', () => {
		beforeEach(initialize);
		const liveBrandIdToFind = 1;
		const liveDestinationIdToFind = 3;
		it('should get vendors by page', async function () {
			const liveVendorView = dbSingleton.get().vendor;
			const destinationToFind: Model.Vendor = await liveVendorView.getByDestinationId(liveDestinationIdToFind);
			const brandToFind: Model.Vendor = await liveVendorView.getByBrandId(liveBrandIdToFind);
			vendorService = new VendorService(liveVendorView);
			let filterObj = {
				...localResource.filter
			};
			filterObj.searchTerm = [
				{
					column: 'destinationId',
					value: liveDestinationIdToFind
				},
				{
					column: 'brandId',
					value: liveBrandIdToFind,
					conjunction: 'OR'
				}
			];
			const pagedVendors: RedSky.RsPagedResponseData<Api.Vendor.Res.Get[]> = await vendorService.getByPage(
				localResource.pagination,
				localResource.sort,
				filterObj
			);
			expect(pagedVendors).to.have.property('data');
			expect(pagedVendors).to.have.property('total');
			expect(pagedVendors.data).to.be.an('array').with.length(2);
			expect(pagedVendors.total).to.equal(2);
			expect(pagedVendors.data.map((v) => v.destinationId)).to.include(destinationToFind.destinationId);
			expect(pagedVendors.data.map((v) => v.brandId)).to.include(brandToFind.brandId);
		});
	});
});
