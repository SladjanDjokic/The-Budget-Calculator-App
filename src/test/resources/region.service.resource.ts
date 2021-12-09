import RegionTableMock from '../../database/mocks/region.db.mock';

const regions: Model.Region[] = [
	{ id: 1, name: 'test 1', isActive: 1 },
	{ id: 2, name: 'test 2', isActive: 1 }
];
const regionToAdd: Api.Region.Req.Create = { name: 'test 3' };
const regionTable = new RegionTableMock(regions);
const regionResource = { regionTable, regionToAdd };

export default regionResource;
