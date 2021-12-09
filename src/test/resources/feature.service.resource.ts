import { FeatureCreate } from '../../database/objects/feature.db';

const companyId = 1;

const featureCreate: FeatureCreate = {
	companyId,
	title: 'New Feature',
	mediaIds: [
		{
			id: 1,
			isPrimary: 1
		}
	],
	isActive: 1,
	isCarousel: 0
};

const featureUpdate: Api.Feature.Req.Update = {
	id: 0,
	description: 'Test Description'
};

const featureMediaUpdate: Api.Feature.Req.Update = {
	id: 0,
	mediaIds: [
		{
			id: 1,
			isPrimary: 1
		}
	]
};

const pagination: RedSky.PagePagination = {
	page: 1,
	perPage: 1
};

const sort: RedSky.SortQuery = {
	field: 'id',
	order: 'ASC'
};

const filter: RedSky.FilterQuery = {
	matchType: 'exact',
	searchTerm: []
};

const featureResource = {
	companyId,
	featureCreate,
	featureUpdate,
	featureMediaUpdate,
	pagination,
	sort,
	filter
};

export default featureResource;
