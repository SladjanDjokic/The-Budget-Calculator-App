import VendorViewMock from '../../database/mocks/vendor.db.mock';

const companyId = 1;
const otherCompanyId = companyId + 99;

const vendorView = new VendorViewMock([
	{
		destinationId: 1,
		brandId: null,
		name: 'Test Destination'
	},
	{
		destinationId: 2,
		brandId: null,
		name: 'Another Test Destination'
	},
	{
		destinationId: 3,
		brandId: null,
		name: 'The Wrong Destination'
	},
	{
		brandId: 1,
		destinationId: null,
		name: 'Test Affilate'
	},
	{
		brandId: 2,
		destinationId: null,
		name: 'Another Test Affilate'
	},
	{
		brandId: 3,
		destinationId: null,
		name: 'Wrong Affilate'
	}
]);

const pagination: RedSky.PagePagination = {
	page: 1,
	perPage: 10
};

const sort: RedSky.SortQuery = {
	field: 'name',
	order: 'ASC'
};

const filter: RedSky.FilterQuery = {
	matchType: 'exact',
	searchTerm: [
		{ column: 'destinationId', value: 2 },
		{ column: 'brandId', value: 1, conjunction: 'OR' }
	]
};

export default interface VendorServiceResource {
	companyId: number;
	otherCompanyId: number;
	vendorView: VendorViewMock;
	pagination: RedSky.PagePagination;
	sort: RedSky.SortQuery;
	filter: RedSky.FilterQuery;
}

export const Resource: VendorServiceResource = {
	companyId,
	otherCompanyId,
	vendorView,
	pagination,
	sort,
	filter
};
