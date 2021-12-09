const companyId: number = 1;
const pagination: RedSky.PagePagination = { page: 1, perPage: 10 };
const sort: RedSky.SortQuery = {
	field: 'name',
	order: 'NONE'
};
const filter: RedSky.FilterQuery = {
	matchType: 'like',
	searchTerm: [{ column: 'name', value: '' }]
};
const categories = [1, 2, 9];

const rewardTableResource = {
	companyId,
	pagination,
	sort,
	filter,
	categories
};

export default rewardTableResource;
