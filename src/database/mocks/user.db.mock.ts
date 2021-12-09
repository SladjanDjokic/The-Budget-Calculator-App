import { RsError } from '../../utils/errors';
import { UserToken, UserToCreate } from '../../services/user/user.service';
import IUserTable, { UserAuthenticate, UsersTierPoints, UserTierUpdate } from '../interfaces/IUserTable';
import UserAddressTableMock from './userAddress.db.mock';
import UserPermissionTableMock from './userPermission.db.mock';
import { DateUtils } from '../../utils/utils';
import TableMock from './table.db.mock';
import userTableResource from '../../test/resources/userTable.db.resource';

export default class UserTableMock extends TableMock implements IUserTable {
	columns: string[] = [
		'id',
		'companyId',
		'tierId',
		'userRoleId',
		'firstName',
		'lastName',
		'primaryEmail',
		'accountNumber',
		'phone',
		'notes',
		'password',
		'token',
		'resetPasswordOnLogin',
		'permissionLogin',
		'createdOn',
		'modifiedOn',
		'joinedOn',
		'birthDate',
		'lastLoginOn',
		'passwordResetGuid',
		'passwordResetExpiresOn',
		'gender',
		'ethnicity',
		'inactiveAfterDate',
		'lifeTimePoints',
		'availablePoints',
		'loginExpiresOn',
		'loginVerificationExpiresOn',
		'loginVerificationGuid',
		'allowEmailNotification'
	];
	createCalls: number = 0;
	getRoleByRoleIdCalls: number = 0;
	getRolesCalls: number = 0;
	getPasswordHashCalls: number = 0;
	authVerificationLoginGuidCalls: number = 0;
	getUserOnlyByIdCalls: number = 0;
	authCalls: number = 0;
	updateCalls: number = 0;
	lastId: number = 0;
	constructor(
		public readonly users: Model.User[],
		public readonly roles: Model.UserRole[],
		public readonly userPermission: UserPermissionTableMock,
		public readonly userAddress: UserAddressTableMock
	) {
		super();
		if (users.length) this.lastId = Math.max(...users.map((u) => u.id));
	}
	async getUserDetails(userId: number): Promise<Api.Customer.Res.Get> {
		const baseUser: Api.User.Filtered = await this.getById(userId);
		return {
			...baseUser,
			tierTitle: '',
			tierBadge: {
				id: 1,
				companyId: 1,
				uploaderId: 2,
				description: '',
				isPrimary: 1,
				title: '',
				urls: {
					thumb: '',
					small: '',
					large: '',
					imageKit: ''
				},
				type: 'image'
			},
			pendingPoints: 1000,
			nextTierThreshold: 20000,
			nextTierTitle: '',
			pointsExpiring: 500,
			pointsExpiringOn: DateUtils.addDays(new Date(), 7)
		};
	}
	async updatePassword(userId: number, newPassword: string): Promise<boolean> {
		const index = this.users.findIndex((u) => u.id === userId);
		const existingUser: Model.User = this.users[index];
		const updatedUser: Model.User = {
			...existingUser,
			password: newPassword
		};
		this.users.splice(index, 1, updatedUser);
		return !!this.getById(userId);
	}

	async getUserOnlyById(userId: number): Promise<any> {
		this.getUserOnlyByIdCalls++;
		const result = this.users.find((u) => u.id === userId);
		return result;
	}

	async getRoles(): Promise<Model.UserRole[]> {
		this.getRolesCalls++;
		return this.roles;
	}

	getLoyaltyMemberRole(): Promise<Model.UserRole> {
		return Promise.resolve(userTableResource.userRole);
	}

	async getRoleByRoleId(roleId: number): Promise<Model.UserRole> {
		this.getRoleByRoleIdCalls++;
		return this.roles.find((r) => r.id === roleId);
	}
	async getTierForUser(userId: number): Promise<Model.Tier> {
		return;
	}
	async updatePoints(userId: number, pointValue: number, pointStatus: Model.UserPointStatusTypes): Promise<any> {
		const index = this.users.findIndex((u) => u.id === userId);
		const existingUser: Model.User = this.users[index];
		const newLifetime: number = Math.max(0, existingUser.lifeTimePoints + pointValue);
		const newAvailable: number = Math.max(0, existingUser.availablePoints + pointValue);
		const updatedUser: Model.User = {
			...existingUser,
			availablePoints: newAvailable,
			lifeTimePoints: newLifetime
		};
		this.users.splice(index, 1, updatedUser);
		return this.getById(userId);
	}

	async getByEmail(email: string): Promise<Api.User.Filtered> {
		const user = this.users.find((user) => user.primaryEmail === email);
		if (!user) return;
		return this.getById(user.id);
	}

	authToken: (token: any, checkLoginExpiration?: boolean) => Promise<UserAuthenticate>;

	async auth(username: string): Promise<UserAuthenticate> {
		this.authCalls++;
		const baseUser = this.users.find((u) => {
			return u.primaryEmail === username;
		});
		return {
			...baseUser,
			pendingPoints: 0,
			permission: [],
			address: [],
			city: '',
			state: '',
			paymentMethods: []
		};
	}
	authResetPasswordGuid: (guid: string) => Promise<any>;
	confirmEmail: (emailGuid: string) => Promise<any>;

	async authVerificationLoginGuid(guid: string): Promise<UserToken> {
		this.authVerificationLoginGuidCalls++;
		const user = this.users.find(
			(u) => u.loginVerificationGuid === guid && new Date(u.loginVerificationExpiresOn) > new Date()
		);
		if (!!!user) throw new RsError('NOT_FOUND');
		return {
			id: user.id,
			token: user.token
		};
	}

	getUsersTierPoints: () => Promise<UsersTierPoints[]>;

	async upsertUserTier(userTier: UserTierUpdate): Promise<any> {
		return;
	}

	async create(tableObj: UserToCreate): Promise<Api.User.Filtered> {
		const now = new Date();
		let newUser: any = {
			...tableObj,
			id: ++this.lastId,
			tierId: 0,
			availablePoints: 0,
			createdOn: now,
			modifiedOn: now,
			notes: '',
			ethnicity: '',
			gender: 'other',
			inactiveAfterDate: '',
			joinedOn: now,
			lastLoginOn: now,
			lifeTimePoints: 0,
			loginExpiresOn: null,
			loginVerificationExpiresOn: null,
			loginVerificationGuid: null,
			passwordResetExpiresOn: null,
			passwordResetGuid: null,
			permissionLogin: tableObj.permissionLogin,
			resetPasswordOnLogin: false,
			birthDate: '',
			allowEmailNotification: 1
		};
		this.users.push(newUser);
		return this.getById(this.lastId);
	}

	async getById(id: number): Promise<Api.User.Filtered> {
		const baseUser = this.users.find((u) => u.id === id);
		const permission = this.userPermission.permissions.filter((p) => p.userId === baseUser.id);
		const addresses = this.userAddress.addresses
			.filter((a) => a.userId === id)
			.map(function (userAddress): Api.User.Address {
				return {
					...userAddress,
					zip: parseInt(userAddress.zip)
				};
			});

		return {
			...baseUser,
			pendingPoints: 0,
			permission,
			address: addresses,
			city: '',
			state: '',
			paymentMethods: []
		};
	}
	getManyByIds: (objIds: readonly number[]) => Promise<any>;

	async update(userId: number, updates: any): Promise<Model.User> {
		this.updateCalls++;
		const index = this.users.findIndex((u) => u.id === userId);
		const oldUser: Model.User = this.users[index];
		const updatedUser: Model.User = {
			...oldUser,
			...updates
		};
		this.users.splice(index, 1, updatedUser);
		return updatedUser;
	}

	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	) => Promise<any>;
	async getPasswordHash(userId: number): Promise<string> {
		return this.users.find((u) => u.id === userId).password;
	}
	async getIdsWithAwardableActions(): Promise<number[]> {
		return this.users.map((user) => user.id);
	}
	async getUsersByAccessScope(accessScope: Model.UserAccessScopeTypes): Promise<Model.User[]> {
		const users = [];
		for (let index in this.users) {
			if (this.users[index].userRoleId === 1) users.push(this.users[index]);
		}
		return users;
	}

	delete: null;
	deleteMany: null;
}
