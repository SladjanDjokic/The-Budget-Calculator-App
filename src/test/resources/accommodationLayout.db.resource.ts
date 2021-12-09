const companyId = 1;
const layoutId = 178; // This must be one that has rooms and media
const manyLayoutIds = [layoutId, 884];
const pagination: RedSky.PagePagination = {
	page: 1,
	perPage: 3
};
const filter: RedSky.FilterQuery = null;
const sort: RedSky.SortQuery = {
	field: 'id',
	order: 'ASC'
};
const accommodationLayoutResource = { companyId, layoutId, manyLayoutIds, pagination, filter, sort };
export default accommodationLayoutResource;
