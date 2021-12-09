const companyId: number = 1;
const destinationDetailId = 3;
const availableDestinationIds: number[] = [1, 3];
const propertyTypeIds: number[] = [1, 2, 3, 4];

const updatedDestination: Api.Destination.Req.Update = {
	id: 1,
	description: 'Testing description destination description',
	locationDescription: 'Testing Location Description'
};

const destinationRegions: Api.Destination.Res.DestinationRegion[] = [
	{ id: 1, name: 'test 1', isActive: 1 },
	{ id: 2, name: 'test 2', isActive: 1 }
];

const propertyTypes: Api.Destination.Res.PropertyType[] = [
	{ id: 1, name: 'test 1' },
	{ id: 2, name: 'test 2' }
];

const pagination: RedSky.PagePagination = {
	page: 1,
	perPage: 2
};
const sort: RedSky.SortQuery = { order: 'ASC', field: 'id' };

const destinationTableResource = {
	companyId,
	availableDestinationIds,
	destinationDetailId,
	updatedDestination,
	destinationRegions,
	propertyTypeIds,
	pagination,
	sort,
	propertyTypes
};

export default destinationTableResource;
