import { IFidel } from '../../integrations/fidel/IFidel';
import { BrandAndLocationAction } from '../../database/interfaces/IActionTable';
import UserService from '../../services/user/user.service';
import UserPointServiceMock from '../../services/userPoint/userPoint.service.mock';
import CompanyServiceMock from '../../services/company/company.service.mock';
import EmailServiceMock from '../../services/email/email.service.mock';
import RedisClientMock from '../../integrations/redis/redisClientMock';
import UserActionTableMock from '../../database/mocks/userAction.db.mock';
import TierService from '../../services/tier/tier.service';
import TierTableMock from '../../database/mocks/tier.db.mock';
import TierFeatureTableMock from '../../database/mocks/tierFeature.db.mock';
import MediaServiceMock from '../../services/media/media.service.mock';
import UserTableMock from '../../database/mocks/user.db.mock';
import UserPermissionTableMock from '../../database/mocks/userPermission.db.mock';
import UserAddressTableMock from '../../database/mocks/userAddress.db.mock';
import { DateUtils, StringUtils } from '../../utils/utils';
import IUserCompletedCampaignTable from '../../database/interfaces/IUserCompletedCampaign';
import UserCompletedCampaignTableMock from '../../database/mocks/userCompletedCampaign.db.mock';
import CampaignServiceMock from '../../services/campaign/campaign.service.mock';
import CampaignTableMock from '../../database/mocks/campaign.db.mock';
import CampaignActionTableMock from '../../database/mocks/campaignAction.db.mock';
import UserPointTableMock from '../../database/mocks/userPoint.db.mock';

const authDetails: IFidel.Transaction.Req.Auth = {
	auth: true,
	currency: 'USD',
	id: '8c9bcf15-efb5-4c8a-84d0-53f5328a7dcc',
	amount: 66.66,
	authCode: '999015',
	wallet: null,
	created: '2021-06-09T15:35:07.074Z',
	accountId: '8409d1d7-31af-4c85-8e7b-2c5cbb47508a',
	cleared: false,
	updated: '2021-06-09T15:35:07.074Z',
	programId: 'bc0a942a-ce4f-4664-bce3-df169c18b324',
	datetime: '2021-06-09T16:35:07',
	card: {
		id: '640f0660-6feb-4309-8785-1fdbc81a6e97',
		firstNumbers: '444400',
		lastNumbers: '4321',
		scheme: 'visa'
	},
	location: {
		address: '175 N Main St',
		city: 'Spanish Fork',
		countryCode: 'USA',
		id: '3f22df72-3cd4-4d5e-8c42-f1bd8e2c4925',
		geolocation: null,
		postcode: '84660',
		state: null,
		timezone: 'Europe/London',
		metadata: null
	},
	brand: {
		id: 'e1b4527c-780c-4293-8117-a77310fd3743',
		name: 'Spire Loyalty Sandbox',
		logoURL: 'https://sand.spireloyalty.com/890dc6eb4c7399705ce3d9e02495db6e.png',
		metadata: null
	},
	identifiers: {
		amexApprovalCode: null,
		mastercardAuthCode: null,
		mastercardRefNumber: null,
		mastercardTransactionSequenceNumber: null,
		MID: 'TEST_MID_150e3159-8443-4c8f-8151-5ae92bce219d',
		visaAuthCode: '999015'
	}
};

const brandAndLocationActions: BrandAndLocationAction[] = [
	{
		id: 6,
		name: 'SWAG (Spicy Wagyu) Burger',
		pointValue: 100,
		brandDetails: [
			{
				id: 1,
				name: 'Spire Loyalty Sandbox',
				externalId: 'e1b4527c-780c-4293-8117-a77310fd3743',
				metaData: {
					accountId: '8409d1d7-31af-4c85-8e7b-2c5cbb47508a',
					logoURL: 'https://sand.spireloyalty.com/890dc6eb4c7399705ce3d9e02495db6e.png',
					created: '2021-05-19T17:58:13.963Z',
					name: 'Spire Loyalty Sandbox',
					live: false,
					consent: true,
					updated: '2021-05-19T17:58:13.963Z',
					websiteURL: 'https://sand.spireloyalty.com',
					id: 'e1b4527c-780c-4293-8117-a77310fd3743'
				},
				locations: [
					{
						id: 1,
						name: '',
						isActive: 1,
						externalId: '3f22df72-3cd4-4d5e-8c42-f1bd8e2c4925',
						metaData: {
							currency: 'USD',
							visa: {
								estimatedActivationDate: null,
								clearingTransactionId: null,
								auth: false,
								authTransactionId: null,
								clearing: false,
								status: 'active'
							},
							geolocation: {
								latitude: 51.5138332,
								longitude: -0.1318224
							},
							city: 'Spanish Fork',
							stateCode: 'UT',
							mastercard: {
								estimatedActivationDate: null,
								clearingTransactionId: null,
								auth: false,
								authTransactionId: null,
								clearing: false,
								status: 'active'
							},
							programId: 'bc0a942a-ce4f-4664-bce3-df169c18b324',
							amex: {
								estimatedActivationDate: null,
								clearingTransactionId: null,
								auth: false,
								authTransactionId: null,
								clearing: false,
								status: 'active'
							},
							searchBy: {
								merchantIds: {
									mastercard: [],
									visa: []
								}
							},
							id: '3f22df72-3cd4-4d5e-8c42-f1bd8e2c4925',
							preonboard: false,
							postcode: '84660',
							accountId: '8409d1d7-31af-4c85-8e7b-2c5cbb47508a',
							activeDate: '2021-05-19T17:59:39.517Z',
							countryCode: 'USA',
							created: '2021-05-19T17:59:39.517Z',
							address: '175 N Main St',
							live: false,
							updated: '2021-05-19T17:59:39.517Z',
							brandId: 'e1b4527c-780c-4293-8117-a77310fd3743',
							timezone: 'Europe/London',
							active: true
						}
					}
				]
			}
		]
	}
];

const campaign: Model.Campaign = {
	activityReferenceNumber: '',
	companyId: 0,
	completionPoints: 0,
	createdOn: undefined,
	description: '',
	endOn: undefined,
	id: 0,
	isActive: undefined,
	maxReward: 0,
	modifiedOn: undefined,
	name: '',
	pointValueMultiplier: 0,
	segmentId: 0,
	startOn: undefined,
	type: ''
};

const actions: Model.Action[] = [
	{
		id: 1,
		companyId: 1,
		brandId: 1,
		brandLocationId: 0,
		name: '',
		description: '',
		createdOn: '',
		modifiedOn: '',
		isActive: 1,
		type: '',
		pointValue: 500
	},
	{
		id: 2,
		companyId: 1,
		brandId: 1,
		brandLocationId: 0,
		name: '',
		description: '',
		createdOn: '',
		modifiedOn: '',
		isActive: 1,
		type: '',
		pointValue: 400
	},
	{
		id: 3,
		companyId: 1,
		brandId: 1,
		brandLocationId: 0,
		name: '',
		description: '',
		createdOn: '',
		modifiedOn: '',
		isActive: 1,
		type: '',
		pointValue: 500
	},
	{
		id: 4,
		companyId: 1,
		brandId: 1,
		brandLocationId: 0,
		name: '',
		description: '',
		createdOn: '',
		modifiedOn: '',
		isActive: 1,
		type: '',
		pointValue: 500
	}
];
const campaignActions: Model.CampaignAction[] = [
	{
		id: 1,
		campaignId: campaign.id,
		actionId: actions[0].id,
		createdOn: '',
		actionCount: 5,
		isActive: 1,
		pointValue: 500
	},
	{
		id: 2,
		campaignId: campaign.id,
		actionId: actions[1].id,
		createdOn: '',
		actionCount: 1,
		isActive: 1,
		pointValue: 400
	}
];
const now = new Date();
const user: Model.User = {
	id: 1,
	companyId: 1,
	tierId: 0,
	userRoleId: 1,
	firstName: 'Test',
	lastName: 'Testington',
	primaryEmail: 'sumdood@example.com',
	accountNumber: 'account',
	phone: '',
	notes: '',
	password: '$2a$10$.Twdfx1/m1Wsmls/BYGDgOrKqZpNUmpgZcDHAeph6sYxh8u9g77tO', // hash of 'existingpassword'
	token: StringUtils.generateGuid(),
	resetPasswordOnLogin: 0,
	permissionLogin: 1,
	createdOn: now,
	modifiedOn: now,
	joinedOn: now,
	birthDate: '',
	lastLoginOn: now,
	passwordResetGuid: StringUtils.generateGuid(),
	passwordResetExpiresOn: DateUtils.addDays(now, 2),
	gender: 'male',
	ethnicity: 'Kekistani',
	inactiveAfterDate: null,
	lifeTimePoints: 0,
	availablePoints: 0,
	loginExpiresOn: DateUtils.addDays(now, 2),
	loginVerificationExpiresOn: DateUtils.addDays(now, 2),
	loginVerificationGuid: StringUtils.generateGuid(),
	allowEmailNotification: 1
};

const userRole: Model.UserRole = {
	id: 1,
	name: 'Test user role',
	accessScope: [
		{
			accessScope: 'TEST',
			read: 1,
			write: 0
		}
	],
	createdOn: now,
	modifiedOn: now,
	isAdmin: 1,
	isCustomer: 0
};
const customerRole: Model.UserRole = {
	id: 2,
	name: 'Test customer role',
	accessScope: [
		{
			accessScope: 'TEST',
			read: 0,
			write: 0
		}
	],
	createdOn: now,
	modifiedOn: now,
	isAdmin: 0,
	isCustomer: 1
};
const tiers: { [key: number]: Model.Tier } = {
	1: {
		id: 525,
		name: 'Bronze',
		description: '',
		createdOn: now,
		modifiedOn: now,
		isActive: 1,
		accrualRate: 1,
		threshold: 0,
		isAnnualRate: 0
	}
};

const userActions: Model.UserAction[] = [
	{
		id: 1,
		userId: user.id,
		campaignActionId: campaignActions[1].id,
		hasAwarded: 1,
		createdOn: '',
		modifiedOn: '',
		refundedOn: null
	}
];

const userAddressTable = new UserAddressTableMock();
const userPermissionTable = new UserPermissionTableMock();

const userTable = new UserTableMock([user], [userRole, customerRole], userPermissionTable, userAddressTable);
const userCompletedCampaignTable: IUserCompletedCampaignTable = new UserCompletedCampaignTableMock(
	[],
	new CampaignTableMock()
);
const userService = new UserService(
	userTable,
	userAddressTable,
	userPermissionTable,
	userCompletedCampaignTable,
	new RedisClientMock(),
	new UserActionTableMock(userActions)
);
const tierService = new TierService(new TierTableMock([], []), new TierFeatureTableMock({}));
tierService.start({
	MediaService: new MediaServiceMock()
});
const companyService = new CompanyServiceMock({
	companyId: 1,
	ap2FactorLoginTimeoutDays: 2,
	ap2FactorLoginVerificationTimeoutHours: 2,
	allowCashBooking: 1,
	allowPointBooking: 1,
	customPages: {},
	unauthorizedPages: []
});
userService.start({
	EmailService: new EmailServiceMock(),
	TierService: tierService,
	CompanyService: companyService
});

const userPointService = new UserPointServiceMock(new UserPointTableMock());
userPointService.start({ UserService: userService });
const campaignService = new CampaignServiceMock(
	new CampaignTableMock([campaign], campaignActions),
	new CampaignActionTableMock()
);
campaignService.start({
	UserService: userService,
	UserPointService: userPointService
});

const transactionResource = {
	companyId: 1,
	authDetails,
	brandAndLocationActions,
	actions,
	campaignActions,
	campaign,
	userService,
	userPointService,
	campaignService
};

export default transactionResource;
