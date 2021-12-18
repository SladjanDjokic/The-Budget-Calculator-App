import UserPermissionTableMock from '../../database/mocks/userPermission.db.mock';
import UserTableMock from '../../database/mocks/user.db.mock';
import UserAddressTableMock from '../../database/mocks/userAddress.db.mock';
import { DateUtils, StringUtils } from '../../utils/utils';
import TierService from '../../services/tier/tier.service';
import TierTableMock from '../../database/mocks/tier.db.mock';
import TierFeatureTableMock from '../../database/mocks/tierFeature.db.mock';
import MediaServiceMock from '../../services/media/media.service.mock';
import UserCompletedCampaignTableMock from '../../database/mocks/userCompletedCampaign.db.mock';
import CampaignTableMock from '../../database/mocks/campaign.db.mock';
import TierMultiplierTableMock from '../../database/mocks/tierMultiplier.db.mock';

export default class UserResource {
	userRole: Model.UserRole;
	customerRole: Model.UserRole;
	userCreate: Api.User.Req.Create;
	guestUserNoEnroll: Api.User.Req.GetOrCreate;
	guestUserEnroll: Api.User.Req.GetOrCreate;
	userUpdate: Api.User.Req.Update;
	createCustomer: Api.User.Req.Create;
	login: any;
	userByPage: RedSky.PageQuery;
	companyId: number;
	hostname: string;
	pointValue: number = 100;
	existingUser: Model.User;
	existingGuestUser: Model.User;
	userRoleUpdate: any;
	userTable: UserTableMock;
	userPermissionTable: UserPermissionTableMock;
	userAddressTable: UserAddressTableMock;
	userCompletedCampaignTable: UserCompletedCampaignTableMock;
	companyVariables: Model.CompanyVariables;
	tierService: TierService;
	pointStatusReceived: Model.UserPointStatusTypes;
	pointStatusRevoked: Model.UserPointStatusTypes;

	constructor() {
		const now = new Date();

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

		this.companyId = 1;
		this.hostname = 'notarealdomain.com';
		this.userByPage = {
			pagination: { page: 1, perPage: 1 },
			sort: { field: 'id', order: 'RAND' },
			filter: { matchType: 'like', searchTerm: [{ column: 'primaryEmail', value: '@' }] }
		};

		this.login = {
			password: 'existingpassword'
		};

		this.guestUserNoEnroll = {
			enroll: 0,
			firstName: 'guest',
			lastName: 'user',
			primaryEmail: 'guestuser@fakemail.com'
		};

		this.guestUserEnroll = {
			enroll: 1,
			firstName: 'enroller',
			lastName: 'guest',
			primaryEmail: 'enrollguest@fakemail.com'
		};

		this.companyVariables = {
			companyId: this.companyId,
			ap2FactorLoginTimeoutDays: 2,
			ap2FactorLoginVerificationTimeoutHours: 2,
			allowCashBooking: 1,
			allowPointBooking: 1,
			customPages: {},
			unauthorizedPages: []
		};

		this.userRole = {
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
		this.customerRole = {
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

		this.existingUser = {
			id: 1,
			companyId: this.companyId,
			tierId: 0,
			userRoleId: this.userRole.id,
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

		this.userCreate = {
			userRoleId: this.userRole.id,
			firstName: 'Test',
			lastName: ' User',
			primaryEmail: Date.now() + '@gmail.com',
			password: this.login.password
		};

		this.createCustomer = {
			firstName: 'Test',
			lastName: 'Customer',
			birthDate: '1776-07-04',
			address: {
				address1: '175 N Main St',
				city: 'Spanish Fork',
				zip: 84660,
				country: 'US',
				type: 'BOTH',
				isDefault: 1
			},
			phone: '801-999-9999',
			primaryEmail: `${Date.now()}_customer@redskytech.io`,
			password: this.login.password,
			emailNotification: 1
		};

		this.userUpdate = {
			firstName: 'Test',
			lastName: 'User Updated'
		};

		this.userRoleUpdate = {
			userRoleId: 2
		};

		this.userPermissionTable = new UserPermissionTableMock();

		this.userAddressTable = new UserAddressTableMock();

		this.userCompletedCampaignTable = new UserCompletedCampaignTableMock([], new CampaignTableMock());
		this.userTable = new UserTableMock(
			[this.existingUser],
			[this.userRole, this.customerRole],
			this.userPermissionTable,
			this.userAddressTable
		);

		const tierMultiplierTable = new TierMultiplierTableMock();
		this.tierService = new TierService(
			new TierTableMock(tiers, [], tierMultiplierTable),
			new TierFeatureTableMock({}),
			tierMultiplierTable
		);

		this.tierService.start({ MediaService: new MediaServiceMock() });

		this.pointStatusReceived = 'RECEIVED';
		this.pointStatusRevoked = 'REVOKED';
	}
}
