import UserService from '../../services/user/user.service';
import SystemActionLogServiceMock from '../../services/systemActionLog/systemActionLog.service.mock';
import ActionServiceMock from '../../services/action/action.service.mock';
import UserPointServiceMock from '../../services/userPoint/userPoint.service.mock';
import UserTableMock from '../../database/mocks/user.db.mock';
import UserPermissionTableMock from '../../database/mocks/userPermission.db.mock';
import UserAddressTableMock from '../../database/mocks/userAddress.db.mock';
import { DateUtils, StringUtils } from '../../utils/utils';
import UserCompletedCampaignTableMock from '../../database/mocks/userCompletedCampaign.db.mock';
import CompanyServiceMock from '../../services/company/company.service.mock';
import EmailServiceMock from '../../services/email/email.service.mock';
import RedisClientMock from '../../integrations/redis/redisClientMock';
import UserActionTableMock from '../../database/mocks/userAction.db.mock';
import TierService from '../../services/tier/tier.service';
import TierTableMock from '../../database/mocks/tier.db.mock';
import TierFeatureTableMock from '../../database/mocks/tierFeature.db.mock';
import MediaServiceMock from '../../services/media/media.service.mock';
import IActionService from '../../services/action/IActionService';
import IUserPointService from '../../services/userPoint/IUserPointService';
import ITriggerService from '../../services/trigger/ITriggerService';
import ICampaignService from '../../services/campaign/ICampaignService';
import ISystemActionLogService from '../../services/systemActionLog/ISystemActionLogService';
import CampaignTableMock from '../../database/mocks/campaign.db.mock';
import TriggerService from '../../services/trigger/trigger.service';
import IUserCompletedCampaignService from '../../services/userCompletedCampaign/IUserCompletedCampaignService';
import UserCompletedCampaignServiceMock from '../../services/userCompletedCampaign/userCompletedCampaign.service.mock';
import IUserCompletedCampaignTable from '../../database/interfaces/IUserCompletedCampaign';
import CampaignActionTableMock from '../../database/mocks/campaignAction.db.mock';
import CampaignService from '../../services/campaign/campaign.service';
import UserPointTableMock from '../../database/mocks/userPoint.db.mock';
import TierMultiplierTableMock from '../../database/mocks/tierMultiplier.db.mock';

const companyId = 1;
const now = new Date();

const user: Model.User = {
	id: 1,
	companyId: companyId,
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
const campaign: Model.Campaign = {
	id: 3,
	activityReferenceNumber: '',
	companyId: 0,
	completionPoints: 500,
	createdOn: undefined,
	description: '',
	endOn: undefined,
	isActive: undefined,
	maxReward: 2000,
	modifiedOn: undefined,
	name: '',
	pointValueMultiplier: 1,
	segmentId: 0,
	startOn: undefined,
	type: ''
};

const actions: Model.Action[] = [
	{
		id: 1,
		companyId,
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
		companyId,
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
		companyId,
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
		companyId,
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

const userActions: Model.UserAction[] = [
	{
		id: 8,
		userId: user.id,
		campaignActionId: campaignActions[1].id,
		hasAwarded: 1,
		createdOn: '',
		modifiedOn: '',
		refundedOn: null
	}
];

for (let i = 0; i < campaignActions[0].actionCount - 1; i++) {
	userActions.push({
		id: 1,
		userId: user.id,
		campaignActionId: campaignActions[0].id,
		hasAwarded: 1,
		createdOn: '',
		modifiedOn: '',
		refundedOn: null
	});
}

const userCompletedCampaigns: Api.UserCampaign.Res.Get[] = [
	{
		id: 1,
		userId: user.id,
		campaignId: 1,
		hasAwarded: 1,
		createdOn: '',
		modifiedOn: '',
		completionPoints: 5000,
		refundedOn: null
	}
];

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
		threshold: 0,
		isAnnualRate: 0
	}
};
const userPermissionTable = new UserPermissionTableMock();

const userAddressTable = new UserAddressTableMock();
const campaignTable = new CampaignTableMock([campaign], campaignActions);

const userCompletedCampaignTable: IUserCompletedCampaignTable = new UserCompletedCampaignTableMock(
	userCompletedCampaigns,
	campaignTable
);

const userTable = new UserTableMock([user], [userRole, customerRole], userPermissionTable, userAddressTable);

const campaignActionTable = new CampaignActionTableMock(campaignActions);
const systemActionLogService: ISystemActionLogService = new SystemActionLogServiceMock();
const userActionTable = new UserActionTableMock(userActions);
const userService = new UserService(
	userTable,
	userAddressTable,
	userPermissionTable,
	userCompletedCampaignTable,
	new RedisClientMock(),
	userActionTable
);
const tierMultiplierTable = new TierMultiplierTableMock();
const tierService = new TierService(
	new TierTableMock(tiers, [], tierMultiplierTable),
	new TierFeatureTableMock({}),
	tierMultiplierTable
);
tierService.start({
	MediaService: new MediaServiceMock()
});
const emailService = new EmailServiceMock();
const companyService = new CompanyServiceMock({
	companyId: companyId,
	ap2FactorLoginTimeoutDays: 2,
	ap2FactorLoginVerificationTimeoutHours: 2,
	allowCashBooking: 1,
	allowPointBooking: 1,
	customPages: {},
	unauthorizedPages: []
});
userService.start({
	TierService: tierService,
	EmailService: emailService,
	CompanyService: companyService
});
const actionService: IActionService = new ActionServiceMock(actions, campaignActions, campaign);
const userPointService: IUserPointService = new UserPointServiceMock(new UserPointTableMock());
userPointService.start({ UserService: userService });
const userCompletedCampaignService: IUserCompletedCampaignService = new UserCompletedCampaignServiceMock(
	userCompletedCampaignTable
);
const campaignService: ICampaignService = new CampaignService(campaignTable, campaignActionTable);
campaignService.start({
	UserService: userService,
	UserPointService: userPointService,
	SystemActionLogService: systemActionLogService
});
const triggerService: ITriggerService = new TriggerService();
triggerService.start({
	CampaignService: campaignService,
	SystemActionLogService: systemActionLogService,
	UserService: userService,
	ActionService: actionService,
	UserPointService: userPointService,
	UserCompletedCampaignService: userCompletedCampaignService
});

const triggerResource = {
	companyId: 1,
	triggerService,
	user,
	userCompletedCampaigns,
	campaignActions,
	actions,
	campaign,
	userService,
	userPointService,
	userCompletedCampaignTable,
	userActionTable
};

export default triggerResource;
