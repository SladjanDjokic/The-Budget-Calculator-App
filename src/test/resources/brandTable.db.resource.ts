const brandId = 1;
const companyId = 1;
const pagination: RedSky.PagePagination = {
	page: 1,
	perPage: 100
};
const sort: RedSky.SortQuery = {
	order: 'ASC',
	field: 'id'
};
const filter: RedSky.FilterQuery = {
	matchType: 'like',
	searchTerm: [{ column: 'loyaltyStatus', value: 'ACTIVE' }]
};
const brandTableResource = {
	brandId,
	pagination,
	sort,
	filter,
	companyId
};
export default brandTableResource;
