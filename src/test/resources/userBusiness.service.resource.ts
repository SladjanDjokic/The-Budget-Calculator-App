import UserBusinessTableMock from '../../database/mocks/userBusiness.db.mock';

const userBusinessTable = new UserBusinessTableMock();

const now = new Date();

const userBusinessCreate: Api.UserBusiness.Req.Create = {
	userId: 1,
	companyId: 1,
	destinationId: null,
	brandId: null,
	brandLocationId: null,
	createdOn: now,
	creatingUserId: 2,
	revokedOn: null,
	revokingUserId: null
};

const campaignResource = {
	companyId: 1,
	userBusinessTable,
	userBusinessCreate
};

export default campaignResource;
