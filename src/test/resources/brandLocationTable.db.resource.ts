const brandId = 1;
const brandLocationId = 1;
const pagination: RedSky.PagePagination = {
	page: 1,
	perPage: 100
};
const sort: RedSky.SortQuery = {
	order: 'ASC',
	field: 'id'
};
const filter: RedSky.FilterQuery = {
	matchType: 'greaterThanEqual',
	searchTerm: [{ column: 'totalTransactionAmount', value: 100 }]
};
const brandLocationTableResource = {
	brandId,
	brandLocationId,
	pagination,
	sort,
	filter
};

export default brandLocationTableResource;
