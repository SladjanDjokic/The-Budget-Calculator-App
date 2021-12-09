import CampaignTableMock from '../../database/mocks/campaign.db.mock';
import CampaignActionTableMock from '../../database/mocks/campaignAction.db.mock';

const campaignTable = new CampaignTableMock();
const campaignActionTable = new CampaignActionTableMock();

const campaignCreate: Api.Campaign.Req.Create = {
	name: 'Test Action',
	description: 'Its a new campaign',
	isActive: 1,
	type: 'POINT_VALUE',
	maxReward: 10000,
	startOn: '2021-04-06',
	endOn: '2021-06-06',
	pointValueMultiplier: 1.5,
	activityReferenceNumber: 'arn-1',
	actions: [{ actionId: 1 }]
};

const campaignUpdate: Omit<Api.Campaign.Req.Update, 'id'> = {
	description: 'Update campaign details',
	pointValueMultiplier: 1
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

const campaignResource = {
	companyId: 1,
	campaignTable,
	campaignActionTable,
	campaignCreate,
	campaignUpdate,
	pagination,
	sort,
	filter
};

export default campaignResource;
