import ITable from '../ITable';

export interface UserAuthenticate extends Api.User.Filtered {
	password: string;
	loginExpiresOn: Date | string;
	loginVerificationExpiresOn: Date | string;
}

export interface UserTierPointsObj {
	id: number;
	userActionId: number;
	orderId: number;
	reservationId: number;
	description: string;
	createdOn: Date | string;
	modifiedOn: Date | string;
	availableOn: Date | string;
	pointType: Model.PointTypes;
	pointAmount: number;
	status: Model.UserPointStatusTypes;
	reason: Model.UserPointStatusTypes;
}

export interface UsersTierPoints {
	userId: number;
	primaryEmail: string;
	lifeTimePoints: number;
	availablePoints: number;
	userTierId: number;
	userTierCreatedOn: Date | string;
	userTierExpiresOn: Date | string;
	points: UserTierPointsObj[];
}

export interface UserTierUpdate {
	userId: number;
	tierId: number;
	expiresOn: Date | string;
}

export type UserCreate = Omit<Partial<Model.User>, 'id'>;

export default interface IUserTable extends ITable {
	getUserDetails: (userId: number) => Promise<Api.User.Res.Detail>;
	getById: (userId: number) => Promise<Api.User.Filtered>;
	getPasswordHash: (userId: number) => Promise<string>;
	updatePassword: (userId: number, newPassword: string) => Promise<boolean>;
	getUserOnlyById: (userId: number) => Promise<any>;
	getRoles: () => Promise<Model.UserRole[]>;
	getLoyaltyMemberRole: () => Promise<Model.UserRole>;
	updatePoints: (
		userId: number,
		pointValue: number,
		pointStatus: Model.UserPointStatusTypes
	) => Promise<Api.User.Filtered>;
	getRoleByRoleId: (roleId: number) => Promise<any>;
	authToken: (token, checkLoginExpiration?: boolean) => Promise<UserAuthenticate>;
	auth: (username: string) => Promise<UserAuthenticate>;
	authResetPasswordGuid: (guid: string) => Promise<any>;
	getByEmail: (email: string) => Promise<Api.User.Filtered>;
	confirmEmail: (emailGuid: string) => Promise<any>;
	authVerificationLoginGuid: (guid: string) => Promise<any>;
	getUsersTierPoints: () => Promise<UsersTierPoints[]>;
	upsertUserTier: (userTier: UserTierUpdate) => Promise<any>;
	create: (userToCreate: UserCreate) => Promise<Api.User.Filtered>;
	getIdsWithAwardableActions: () => Promise<number[]>;
	getTierForUser: (userId: number) => Promise<Model.Tier>;
	getMultiplierForUser: (userId: number) => Promise<{ multiplier: number }>;
	getUsersByAccessScope: (accessScope: Model.UserAccessScopeTypes) => Promise<Model.User[]>;
}
