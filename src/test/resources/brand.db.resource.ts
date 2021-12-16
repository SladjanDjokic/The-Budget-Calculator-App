const brandId = 1;
const pagination: RedSky.PagePagination = {
	page: 1,
	perPage: 2
};
const filter: RedSky.FilterQuery = {
	matchType: 'like',
	searchTerm: [
		{
			column: 'loyaltyStatus',
			value: 'ACTIVE'
		}
	]
};
const sort: RedSky.SortQuery = {
	field: 'name',
	order: 'DESC'
};
const brandTableResource = {
	brandId,
	pagination,
	filter,
	sort
};

export default brandTableResource;
