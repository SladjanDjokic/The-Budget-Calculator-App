const companyId = 1;
const accommodationId = 19;
const pagination: RedSky.PagePagination = {
	page: 1,
	perPage: 20
};
const filter: RedSky.FilterQuery = null;
const sort: RedSky.SortQuery = {
	field: 'id',
	order: 'ASC'
};
const accommodationResource = { companyId, accommodationId, pagination, filter, sort };
export default accommodationResource;
