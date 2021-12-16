import { Service } from '../Service';
import IUserTable, {
	UserAuthenticate,
	UserCreate,
	UsersTierPoints,
	UserTierUpdate
} from '../../database/interfaces/IUserTable';
import { ErrorCode, RsError } from '../../utils/errors';
import bcrypt from '../../utils/bcrypt';
import { DateUtils, ObjectUtils, StringUtils, WebUtils } from '../../utils/utils';
import IEmailService, { EmailReplyType, EmailSendImmediate, EmailType } from '../email/IEmailService';
import ICompanyService from '../company/ICompanyService';
import IUserAddressTable from '../../database/interfaces/IUserAddressTable';
import IUserPermissionTable from '../../database/interfaces/IUserPermissionTable';
import TierService from '../tier/tier.service';
import { IRedisClient } from '../../integrations/redis/IRedisClient';
import IUserActionTable, { UserActionCreate } from '../../database/interfaces/IUserActionTable';
import logger from '../../utils/logger';
import IUserCompletedCampaignTable from '../../database/interfaces/IUserCompletedCampaign';
import CompanyService from '../company/company.service';
import EmailService from '../email/email.service';
import { ServiceName } from '../serviceFactory';

export interface UserToUpdate extends Api.User.Req.Update {
	lastLoginOn?: Date | string;
}

export interface UserToCreate
	extends Api.User.Req.Create,
		Pick<Model.User, 'token' | 'accountNumber'>,
		Partial<Pick<Model.User, 'companyId' | 'joinedOn' | 'permissionLogin'>> {}

interface GuestUserToCreate extends Api.User.Req.GetOrCreate {
	password: '';
}

export interface UserToken {
	id: number;
	token: string;
}

const PASSWORD_RESET_EXPIRATION_HOURS = 24;
const ADMIN_PASSWORD_RESET_EXPIRATION_HOURS = 2;

export default class UserService extends Service {
	companyService: ICompanyService;
	emailService: IEmailService;
	tierService: TierService;

	constructor(
		private readonly userTable: IUserTable,
		private readonly userAddressTable: IUserAddressTable,
		private readonly userPermissionTable: IUserPermissionTable,
		private readonly userCompletedCampaignTable: IUserCompletedCampaignTable,
		private readonly redisClient: IRedisClient,
		private readonly userActionTable: IUserActionTable
	) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.companyService = services['CompanyService'] as CompanyService;
		this.emailService = services['EmailService'] as EmailService;
		this.tierService = services['TierService'] as TierService;
	}

	getUserFields(): string[] {
		return this.userTable.columns;
	}

	isValidUser(user: UserAuthenticate | Partial<Api.User.Model>): boolean {
		if (!user.permissionLogin) {
			return false;
		}
		return !!user.userRoleId;
	}

	isLoginExpired(user: Api.User.Filtered): boolean {
		return !!(user?.loginExpiresOn && Date.now() > new Date(user.loginExpiresOn).getTime());
	}

	async isAdminOrAbove(user: Model.User | Api.User.Filtered): Promise<boolean> {
		if (!user || !user.userRoleId) return false;
		const companyUserRoles = await this.userTable.getRoles();
		for (let role of companyUserRoles) {
			if (role.id !== user.userRoleId) continue;
			return !!role.isAdmin;
		}
	}

	isValidEmailAddress(email: string): boolean {
		if (!email) return false;
		if (email.length > 256) return false;
		let tester = /^[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
		if (!tester.test(email)) return false;
		// A few things regex can't do
		let [account, address] = email.split('@');
		if (account.length > 64) return false;
		let domainParts = address.split('.');
		return !domainParts.some(function (part) {
			return part.length > 63;
		});
	}

	getByPage(pagination: RedSky.PagePagination, sort: RedSky.SortQuery, filter: RedSky.FilterQuery) {
		return this.userTable.getByPage(pagination, sort, filter);
	}

	async getByToken(user: Api.User.Model): Promise<Api.User.Res.Login> {
		if (!this.isValidUser(user)) {
			throw new RsError('FORBIDDEN', 'User access is forbidden');
		}
		return this.getUserDetails(user.id);
	}

	async getUserForEmail(emailAddress: string): Promise<Api.User.Filtered> {
		try {
			return this.userTable.getByEmail(emailAddress);
		} catch (e) {
			if (e.err === 'NOT_FOUND') return null;
			throw e;
		}
	}

	async login(username: string, password: string): Promise<Api.User.Res.Login> {
		const cleanUser: UserAuthenticate = await this.auth(username, password);
		if (!this.isValidUser(cleanUser)) {
			throw new RsError('FORBIDDEN', 'User access is forbidden');
		}
		await this.updateUserLogin(cleanUser);
		return this.getUserDetails(cleanUser.id);
	}

	async loginAdminPortal(username: string, password: string, hostname: string): Promise<Api.User.Res.Login> {
		const cleanUser: UserAuthenticate = await this.auth(username, password);
		if (!!!cleanUser) throw new RsError('INCORRECT_EMAIL_OR_PASSWORD');
		if (!this.isValidUser(cleanUser) || !(await this.isAdminOrAbove(cleanUser))) {
			throw new RsError('FORBIDDEN', 'User access is forbidden');
		}
		if (this.isLoginExpired(cleanUser)) {
			await this.sendLoginVerification(cleanUser.id, hostname, cleanUser.companyId);
			throw new RsError('LOGIN_EXPIRED', 'User Login has expired');
		}
		await this.updateUserLogin(cleanUser);
		return this.getUserDetails(cleanUser.id);
	}

	async create(userCreateObj: Api.User.Req.Create, hostname: string, companyId?: number): Promise<Api.User.Filtered> {
		const userToCreate: UserToCreate = await this.formatUserAndSettingsToCreate(userCreateObj, companyId);
		let user: Api.User.Filtered = await this.userTable.create(userToCreate);
		if (userCreateObj.address) {
			await this.userAddressTable.create({ ...userCreateObj.address, isDefault: 1, userId: user.id });
		}
		await this.createUserPermission(user.id, user.userRoleId);
		const role: Model.UserRole = await this.userTable.getRoleByRoleId(user.userRoleId);
		if (role.isCustomer) {
			await this.sendSignupEmail(user, hostname);
		}
		if (role.isAdmin) {
			const passwordResetGuid = StringUtils.generateGuid();
			const passwordResetExpiresOn = DateUtils.hoursFromNow(24);
			await this.sendForgotPasswordEmail(user, passwordResetGuid, hostname);
			await this.userTable.update(user.id, { passwordResetGuid, passwordResetExpiresOn });
		}
		return this.sanitizeUserObject(await this.userTable.getById(user.id));
	}

	async getOrCreate(
		userCreateObj: Api.User.Req.GetOrCreate,
		hostname: string,
		companyId?: number
	): Promise<Api.User.Filtered> {
		const existingUser = await this.userTable.getByEmail(userCreateObj.primaryEmail);
		if (existingUser) {
			if (!!existingUser.permissionLogin || !!!userCreateObj.enroll) return existingUser;
			else return this.update(existingUser.id, { permissionLogin: userCreateObj.enroll });
		}

		const guestUserToCreate: GuestUserToCreate = {
			...userCreateObj,
			password: ''
		};
		return this.create(guestUserToCreate, hostname, companyId);
	}

	async createAdmin(userCreateObj: Api.User.Req.Create): Promise<Api.User.Filtered> {
		const adminToCreate = await this.formatAdminCreate(userCreateObj);
		let adminUser: Api.User.Filtered = await this.userTable.create(adminToCreate);
		await this.createUserPermission(adminUser.id, adminUser.userRoleId);
		return adminUser;
	}

	async createCustomer(customerCreateObj: Api.Customer.Req.Create, hostname: string): Promise<Api.User.Filtered> {
		await this.isValidToCreate(customerCreateObj);
		const customerToCreate = await this.formatCustomerCreateObj(customerCreateObj);
		const createdCustomer = await this.userTable.create(customerToCreate);
		await this.sendSignupEmail(createdCustomer, hostname);
		return await this.getById(createdCustomer.id);
	}

	async update(userId: number, userUpdateObj: UserToUpdate) {
		userUpdateObj = this.sanitizeUserToUpdate(userUpdateObj);
		if (userUpdateObj.userRoleId) {
			await this.deleteUserPermission(userId);
			await this.createUserPermission(userId, userUpdateObj.userRoleId);
		}
		const user: Api.User.Filtered = await this.userTable.update(userId, userUpdateObj);
		await this.redisClient.set(`user_${user.token}`, user);
		return user;
	}

	async getUserDetails(userId: number): Promise<Api.User.Res.Detail> {
		const user = await this.userTable.getUserDetails(userId);
		return this.sanitizeUserObject(user);
	}

	async updatePoints(
		userId: number,
		pointValue: number,
		pointStatus: Model.UserPointStatusTypes
	): Promise<Api.User.Filtered> {
		const updatedUser = await this.userTable.updatePoints(userId, pointValue, pointStatus);
		const allTiers = await this.tierService.getAll();
		allTiers.sort((tier1, tier2) => tier1.threshold - tier2.threshold);
		let userTier: Model.Tier;
		let tierExpiration;
		allTiers.forEach((tier) => {
			if (updatedUser.lifeTimePoints >= tier.threshold) {
				userTier = tier;
			}
		});
		if (!userTier) {
			userTier = allTiers[0];
		}
		if (!userTier.isAnnualRate) {
			const today = new Date();
			const yearExpiration = today.getUTCFullYear() + 2;
			tierExpiration = DateUtils.clientToServerDateTime(new Date(`${yearExpiration}-01-01`));
		}
		const tierObj = {
			userId: userId,
			tierId: userTier.id,
			expiresOn: tierExpiration
		};
		await this.updateUserTier(tierObj);
		return updatedUser;
	}

	async createUserPermission(userId: number, userRoleId: number) {
		const role: Model.UserRole = await this.userTable.getRoleByRoleId(userRoleId);
		for (let accessScope of role.accessScope) {
			await this.userPermissionTable.create({
				userId: userId,
				key: accessScope.accessScope,
				read: accessScope.read,
				write: accessScope.write
			});
		}
	}

	async deleteUserPermission(userId: number) {
		return await this.userPermissionTable.deleteForUser(userId);
	}

	async authToken(token: string, checkLoginExpiration: boolean = false) {
		let user: any = await this.redisClient.get('user_' + token);
		if (checkLoginExpiration && this.isLoginExpired(user))
			throw new RsError('LOGIN_EXPIRED', 'User Login has expired');
		if (user) return user;
		user = (await this.userTable.authToken(token, checkLoginExpiration)) as UserAuthenticate;
		delete user.password;
		user.permission = ObjectUtils.smartParse(user.permission);
		user.address = ObjectUtils.smartParse(user.address);
		await this.redisClient.set('user_' + user.token, user);
		return user;
	}

	async auth(username: string, password: string) {
		if (!username || !password) {
			throw new RsError('INCORRECT_EMAIL_OR_PASSWORD');
		}
		let user: UserAuthenticate;
		try {
			user = await this.userTable.auth(username);
		} catch (err) {
			logger.warn(`User not found for ${username}`);
			return null;
		}
		let match = await bcrypt.compare(password, user.password);
		if (!match) {
			throw new RsError('INCORRECT_EMAIL_OR_PASSWORD');
		}
		delete user.password;
		user.permission = ObjectUtils.smartParse(user.permission);
		user.address = ObjectUtils.smartParse(user.address);
		await this.redisClient.set(`user_${user.token}`, user);
		return user;
	}

	async getById(id: number): Promise<Api.User.Filtered> {
		return this.userTable.getById(id);
	}

	async delete(id: number) {
		let obj = {
			modifiedOn: DateUtils.dbNow(),
			inactiveAfterDate: DateUtils.dbNow(),
			permissionLogin: 0
		};
		await this.userTable.update(id, obj);
		return true;
	}

	async reactivate(id: number) {
		let obj = {
			modifiedOn: DateUtils.dbNow(),
			inactiveAfterDate: null,
			permissionLogin: 1
		};
		await this.userTable.update(id, obj);
		return true;
	}

	async validatePasswordResetGuid(guid: string) {
		await this.userTable.authResetPasswordGuid(guid);
		return true;
	}

	async forgotPassword(email: string, hostname: string, isAdmin: boolean = false) {
		let dbUser: Api.User.Filtered = await this.userTable.getByEmail(email);
		const passwordResetGuid = StringUtils.generateGuid();
		const passwordResetExpiresOn = DateUtils.hoursFromNow(
			isAdmin ? ADMIN_PASSWORD_RESET_EXPIRATION_HOURS : PASSWORD_RESET_EXPIRATION_HOURS
		);
		await this.sendForgotPasswordEmail(dbUser, passwordResetGuid, hostname);
		await this.userTable.update(dbUser.id, { passwordResetGuid, passwordResetExpiresOn });
		return true;
	}

	async resetPassword(passwordGuid: string, newPassword: string) {
		let user: Omit<Api.User.Filtered, 'password'> = await this.userTable.authResetPasswordGuid(passwordGuid);
		let hash = await bcrypt.hash(newPassword, null);
		await this.userTable.update(user.id, { password: hash });
		return user;
	}

	async isEmailUnique(email: string): Promise<boolean> {
		try {
			const user = await this.userTable.getByEmail(email);
			if (!user) return true;
			return false;
		} catch (e) {
			return true;
		}
	}

	async confirmEmail(emailGuid: string) {
		if (!emailGuid) throw new RsError('BAD_REQUEST', 'Missing email Guid');
		let result: Api.User.Res.Login = await this.userTable.confirmEmail(emailGuid);
		await this.userTable.update(result.id, { emailVerified: 1, updatedOn: DateUtils.dbNow() });
		await this.sendNotificationAndCompanyConfirmationEmail(result);
		return result;
	}

	async verifyLogin(loginGuid: string): Promise<Api.User.Filtered> {
		const verifiedUser: UserToken = await this.userTable.authVerificationLoginGuid(loginGuid);
		return await this.updateUserLoginExpiration(verifiedUser);
	}

	sanitizeUserObject<T extends Api.User.Model | Api.User.Filtered>(user: T): T {
		if ('password' in user) delete (user as any).password;
		return user;
	}

	getManyByIds(userIdList: number[]) {
		return this.userTable.getManyByIds(userIdList);
	}

	updateMany(userIdList: number[], userUpdateObj: Api.User.Req.Update) {
		return this.userTable.updateMany(userIdList, userUpdateObj);
	}

	deleteMany(userIdList: number[]) {
		return this.userTable.deleteMany(userIdList);
	}

	async flushUserFromCache(userId: number): Promise<void> {
		const userObj: Api.User.Filtered = await this.getById(userId);
		return this.redisClient.set(`user_${userObj.token}`, userObj);
	}

	getUsersTierPoints(): Promise<UsersTierPoints[]> {
		return this.userTable.getUsersTierPoints();
	}

	getUserOnlyById(userId: number) {
		return this.userTable.getUserOnlyById(userId);
	}

	async getRoles(): Promise<Model.UserRole[]> {
		return this.userTable.getRoles();
	}

	async getCustomerRoles() {
		const companyRoles: Model.UserRole[] = await this.getRoles();
		const customerRoles: Model.UserRole[] = [];
		for (let role of companyRoles) {
			if (!role.isCustomer) continue;
			customerRoles.push(role);
		}
		return customerRoles;
	}

	async updateUserTier(tierUpdate: UserTierUpdate) {
		await this.userTable.update(tierUpdate.userId, { tierId: tierUpdate.tierId });
		await this.userTable.upsertUserTier(tierUpdate);
	}

	async updatePassword(
		userId: number,
		oldPassword: string,
		newPassword: string,
		companyId: number
	): Promise<boolean> {
		const oldPasswordHash: string = await this.userTable.getPasswordHash(userId);
		const match = await bcrypt.compare(oldPassword, oldPasswordHash);
		if (!match) throw new RsError('INCORRECT_EMAIL_OR_PASSWORD');
		const newHash: string = (await bcrypt.hash(newPassword, null)) as string;
		return this.userTable.updatePassword(userId, newHash);
	}

	async createUserCompletedCampaign(campaignId: number, userId: number): Promise<Api.UserCampaign.Res.Get> {
		try {
			const previouslyCompletedCampaign = await this.userCompletedCampaignTable.getById(campaignId, userId);
			if (previouslyCompletedCampaign) return null;
			return this.userCompletedCampaignTable.create(userId, campaignId);
		} catch (e) {
			logger.error(JSON.stringify(e));
		}
	}

	createUserAction(userActionDetails: UserActionCreate): Promise<Model.UserAction> {
		return this.userActionTable.create(userActionDetails);
	}

	createManyUserActions(userId: number, campaignActionIds: number[]): Promise<Model.UserAction[]> {
		return this.userActionTable.createMany(userId, campaignActionIds);
	}

	refundUserAction(userActionId: number) {
		return this.userActionTable.refundUserAction(userActionId);
	}

	getUserActionsByUserId(userId: number): Promise<Model.UserAction[]> {
		return this.userActionTable.getByUserId(userId);
	}

	updateManyUserActionsById(userId: number, actionIds: number[]): Promise<Model.UserAction[]> {
		return this.userActionTable.updateManyForUser(userId, actionIds);
	}

	/**
	 * Internal use only - Get ids of users with Awardable userActions
	 */
	getUserIdsWithAwardableActions(): Promise<number[]> {
		return this.userTable.getIdsWithAwardableActions();
	}

	getTierForUser(userId: number) {
		return this.userTable.getTierForUser(userId);
	}

	async getTierMultiplierForUser(userId: number) {
		const result = await this.userTable.getMultiplierForUser(userId);
		return result.multiplier;
	}

	private async isValidToCreate(user: UserToCreate | Api.Customer.Req.Create | Api.User.Req.Create): Promise<void> {
		if (!this.isValidEmailAddress(user.primaryEmail)) throw new RsError('BAD_REQUEST', 'Invalid email format');
		let isUniqueEmail: boolean = await this.isEmailUnique(user.primaryEmail);
		if (!isUniqueEmail) throw new RsError('DUPLICATE_EMAIL', 'Unable to create user. User email is not unique.');
	}

	private async formatCustomerCreateObj({ name, ...customerCreateObj }: Api.Customer.Req.Create) {
		const nameList = name.split(' ');
		const loyaltyMemberRole: Model.UserRole = await this.userTable.getLoyaltyMemberRole();
		let customer = {
			...customerCreateObj,
			token: StringUtils.generateGuid(),
			firstName: nameList.shift(),
			lastName: nameList.join(' '),
			userRoleId: loyaltyMemberRole.id
		};
		customer.primaryEmail = customer.primaryEmail.toLowerCase();
		customer.password = (await bcrypt.hash(customer.password, null)) as string;
		return this.sanitizeCustomerToCreate(customer);
	}

	private async formatAdminCreate(adminCreate: Api.User.Req.Create) {
		let adminToCreate: UserCreate = {
			...adminCreate,
			token: StringUtils.generateGuid()
		};
		adminToCreate.primaryEmail = adminToCreate.primaryEmail.toLowerCase();
		adminToCreate.password = (await bcrypt.hash(adminToCreate.password, null)) as string;
		return adminToCreate;
	}

	private async formatUserAndSettingsToCreate(
		userRequest: Api.User.Req.Create | GuestUserToCreate,
		companyId?: number
	): Promise<UserToCreate> {
		await this.isValidToCreate(userRequest);
		const userToCreate: UserToCreate = {
			...userRequest,
			accountNumber: this.getUserAccountNumber(companyId),
			token: StringUtils.generateGuid(),
			primaryEmail: userRequest.primaryEmail.toLowerCase()
		};
		if (companyId) userToCreate.companyId = companyId;
		if (userRequest.password) {
			userToCreate.password = await bcrypt.hash(userRequest.password, null);
		}
		if (!!!userToCreate.userRoleId) {
			const customerRole: Model.UserRole = await this.userTable.getLoyaltyMemberRole();
			userToCreate.userRoleId = customerRole.id;
			// This uses a strict check, since the regular user creation doesn't have enroll
			if ((userRequest as GuestUserToCreate).enroll !== undefined) {
				const guestUser: GuestUserToCreate = userRequest as GuestUserToCreate;
				userToCreate.permissionLogin = guestUser.enroll;
				if (guestUser.enroll !== 0) {
					userToCreate.joinedOn = DateUtils.clientToServerDate(new Date());
				}
			}
		}
		for (const key of Object.keys(userToCreate)) {
			if (!this.userTable.columns.includes(key)) delete userToCreate[key];
		}

		return userToCreate;
	}

	private async updateUserLogin(user: UserAuthenticate): Promise<void> {
		if (!!!user?.id) return;

		user.lastLoginOn = DateUtils.dbNow();
		this.update(user.id, { lastLoginOn: user.lastLoginOn });
	}

	private async updateUserLoginExpiration(user: UserToken): Promise<Api.User.Filtered> {
		// The following is a placeholder. The relevant setting will be moved to the platform level.
		const companyVariables: Model.CompanyVariables = await this.companyService.getVariables(1);
		const loginExpiresOn = DateUtils.clientToServerDateTime(
			DateUtils.addDays(new Date(), companyVariables.ap2FactorLoginTimeoutDays)
		);
		const updatedUser = await this.userTable.update(user.id, {
			loginExpiresOn,
			loginVerificationExpiresOn: DateUtils.dbNow(),
			token: StringUtils.generateGuid()
		});
		await this.redisClient.del(`user_${user.token}`);
		await this.redisClient.set(`user_${updatedUser.token}`, updatedUser);
		return updatedUser;
	}

	private async sendNotificationAndCompanyConfirmationEmail(user: Api.User.Res.Login) {
		const emailObj: EmailSendImmediate = {
			templateType: EmailType.WELCOME,
			recipientEmail: user.primaryEmail,
			emailReplyType: EmailReplyType.DEFAULT,
			metaData: {
				button_link: 'https://localhost:3000/user-management'
			}
		};
		await this.emailService.sendImmediate(emailObj);
	}

	private async sendForgotPasswordEmail(user: Api.User.Filtered, passwordGuid: string, hostname: string) {
		let emailObj: EmailSendImmediate = {
			templateType: EmailType.RESET_PASSWORD,
			recipientEmail: user.primaryEmail,
			emailReplyType: EmailReplyType.DEFAULT,
			metaData: {
				first_name: user.firstName,
				last_name: user.lastName,
				reset_link: `https://${hostname}/password-reset?guid=${passwordGuid}`
			}
		};
		await this.emailService.sendImmediate(emailObj);
	}

	private async sendSignupEmail(user: Api.User.Model | Api.User.Filtered, hostname: string) {
		let emailObj: EmailSendImmediate = {
			templateType: EmailType.SIGN_UP,
			recipientEmail: user.primaryEmail,
			emailReplyType: EmailReplyType.DEFAULT,
			metaData: {
				first_name: user.firstName,
				last_name: user.lastName,
				button_link: `https://${hostname}/signin`
			}
		};
		await this.emailService.sendImmediate(emailObj);
	}

	private async sendLoginVerification(userId: number, hostname: string, companyId?: number) {
		// The following is a placeholder. The relevant setting will be moved to the platform level.
		const companyVariables: Model.CompanyVariables = await this.companyService.getVariables(1);
		await this.userTable.update(
			userId,
			{
				loginVerificationGuid: StringUtils.generateGuid(),
				loginVerificationExpiresOn: DateUtils.hoursFromNow(
					companyVariables.ap2FactorLoginVerificationTimeoutHours
				)
			},
			companyId
		);
		const userToVerify: Model.User = await this.userTable.getUserOnlyById(userId);
		const emailObj: EmailSendImmediate = {
			templateType: EmailType.AP_LOGIN_2FA,
			recipientEmail: userToVerify.primaryEmail,
			emailReplyType: EmailReplyType.DEFAULT,
			metaData: {
				button_link: `https://${hostname}/api/v1/user/login/verify?guid=${userToVerify.loginVerificationGuid}`
			}
		};
		await this.emailService.sendImmediate(emailObj);
	}

	private getUserAccountNumber(companyId: number) {
		let dateTimeString = Date.now().toString();
		return `${companyId}-${dateTimeString.slice(3, 6)}-${dateTimeString.slice(6, 13)}`;
	}

	private sanitizeCustomerToCreate(
		customer: Omit<Api.Customer.Req.Create, 'newsLetter' | 'emailNotification' | 'name'>
	) {
		const invalidFields = ['newsLetter', 'emailNotification', 'name', 'address', 'city', 'state', 'zip', 'country'];
		for (let i in customer) {
			if (invalidFields.includes(i)) delete customer[i];
		}
		return customer;
	}

	private sanitizeUserToUpdate(user: Api.User.Req.Update): Api.User.Req.Update {
		const invalidFields = ['password'];
		for (let i in user) {
			if (invalidFields.includes(i)) delete user[i];
		}
		return user;
	}
}
