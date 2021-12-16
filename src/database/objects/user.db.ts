import Table from '../Table';
import { RsError } from '../../utils/errors';
import { ObjectUtils } from '../../utils/utils';
import mysql from 'mysql';
import IUserTable, { UserAuthenticate, UsersTierPoints, UserTierUpdate } from '../interfaces/IUserTable';

export default class User extends Table implements IUserTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	private static readonly paymentServiceTypeName: Model.ServiceKeyType = 'PAYMENT';

	async getUserDetails(userId: number): Promise<Api.Customer.Res.Get> {
		return await this.db.queryOne(
			`SELECT
				user.id,
				user.companyId,
				user.tierId,
				user.userRoleId,
				user.firstName,
				user.lastName,
				user.primaryEmail,
				user.accountNumber,
				user.phone,
				user.notes,
				user.token,
				user.createdOn,
				user.modifiedOn,
				user.joinedOn,
				user.birthDate,
				user.lastLoginOn,
				user.permissionLogin,
				IFNULL(userPermissions.permission, '[]') permission,
				IFNULL(userAddresses.address,'[]') address,
				IFNULL(user.lifeTimePoints,0) AS lifeTimePoints,
				IFNULL(user.availablePoints,0) AS availablePoints,
				IFNULL(pendingPoints.total,0) AS pendingPoints,
				nextExpiration.pointAmount AS pointsExpiring,
				nextExpiration.expiration AS pointsExpiringOn,
				tierBadge.badge AS tierBadge,
				tier.name AS tierTitle,
				defaultAddress.city,
				defaultAddress.state,
				user.loginExpiresOn,
				user.loginVerificationExpiresOn,
				nextTier.name AS nextTierTitle,
				IFNULL(MIN(nextTier.threshold), null) AS nextTierThreshold,
				IFNULL(userPaymentMethods.paymentMethods,'[]') paymentMethods,
       			allowEmailNotification
			FROM user
                JOIN userRole ON user.userRoleId=userRole.id
				LEFT JOIN (SELECT city, state, userId FROM userAddress WHERE isDefault=1 GROUP BY userId) defaultAddress on defaultAddress.userId=user.id
				LEFT JOIN tier ON user.tierId=tier.id
				LEFT JOIN tier AS nextTier 
					ON nextTier.threshold > user.lifetimePoints
				LEFT JOIN (
					SELECT
						mediaMap.tierId AS tierId,
						${Table.concatenateMediaObject} AS badge
					FROM media 
						JOIN mediaMap ON mediaMap.mediaId = media.id
					WHERE mediaMap.tierId IS NOT NULL AND media.isPrimary=TRUE
				) AS tierBadge ON user.tierId=tierBadge.tierId
				LEFT JOIN (
					SELECT
						userId,
						MIN(expireOn) AS expiration,
						pointAmount
					FROM userPoint
					WHERE status='RECEIVED' AND expireOn IS NOT NULL
					GROUP BY userId
				) AS nextExpiration ON nextExpiration.userId=user.id
				LEFT JOIN (
					SELECT
						userId,
						SUM(pointAmount) as total
					FROM userPoint
					WHERE status='PENDING'
					GROUP BY userId
				) AS pendingPoints ON pendingPoints.userId=user.id
				LEFT JOIN (${User.userPaymentMethodsSubquery}) userPaymentMethods ON userPaymentMethods.userId=user.id
				LEFT JOIN (${this.userPermissionsQuery()}) AS userPermissions ON userPermissions.userId=user.id
				LEFT JOIN (${this.userAddressQuery()}) as userAddresses on userAddresses.userId=user.id
			WHERE user.id=?
			GROUP BY user.id;`,
			[userId]
		);
	}
	async updatePassword(userId: number, newPassword: string): Promise<boolean> {
		await this.db.queryOne(`UPDATE ${this.tableName} SET password=? WHERE id=?;`, [newPassword, userId]);
		return true;
	}

	async authToken(token, checkLoginExpiration: boolean = false): Promise<UserAuthenticate> {
		let loginExpirationString = '';
		if (checkLoginExpiration) loginExpirationString = ' AND loginExpiresOn > NOW()';
		try {
			let user = await this.db.queryOne(
				`SELECT 
 						id,
						companyId,
						tierId,
						userRoleId,
						firstName,
						lastName,
						primaryEmail,
						accountNumber,
						phone,
						notes,
						token,
						createdOn,
						modifiedOn,
						joinedOn,
						birthDate,
						lastLoginOn,
						permissionLogin,
						IFNULL(userPermissions.permission, '[]') permission,
						IFNULL(userAddresses.address,'[]') address,
						IFNULL(pendingPoints.total,0) AS pendingPoints,
						lifeTimePoints,
						availablePoints,
						defaultAddress.city,
						defaultAddress.state,
						loginExpiresOn,
						loginVerificationExpiresOn,
						IFNULL(userPaymentMethods.paymentMethods, '[]') paymentMethods
						FROM  user
							LEFT JOIN (${this.userPermissionsQuery()}) as userPermissions on userPermissions.userId=user.id 
							LEFT JOIN (${this.userAddressQuery()}) as userAddresses on userAddresses.userId=user.id 
							LEFT JOIN (SELECT city, state, userId FROM userAddress WHERE isDefault=1) defaultAddress on defaultAddress.userId=user.id 
							LEFT JOIN (
								SELECT
									userId,
									SUM(pointAmount) as total
								FROM userPoint
								WHERE status='PENDING'
								GROUP BY userId
							) AS pendingPoints ON pendingPoints.userId=user.id
							LEFT JOIN (
								${User.userPaymentMethodsSubquery}
							) userPaymentMethods ON userPaymentMethods.userId=user.id
						WHERE (inactiveAfterDate IS NULL OR inactiveAfterDate > NOW()) AND permissionLogin=1 AND token=? ${loginExpirationString};`,
				[token]
			);
			delete user.password;
			return user;
		} catch (e) {
			if (e.err === 'NOT_FOUND') {
				throw new RsError('INVALID_TOKEN');
			} else if (e.err === 'DUPLICATE') {
				throw new RsError('DUPLICATE_TOKEN');
			} else {
				throw new RsError('INVALID_TOKEN', e.msg || e.message);
			}
		}
	}

	async auth(username: string): Promise<UserAuthenticate> {
		try {
			return await this.db.queryOne(
				`SELECT 
						id,
						companyId,
						tierId,
						userRoleId,
						firstName,
						lastName,
						primaryEmail,
						accountNumber,
						phone,
						notes,
						token,
						createdOn,
						modifiedOn,
						joinedOn,
						birthDate,
						lastLoginOn,
						password,
						permissionLogin,
						IFNULL(userPermissions.permission, '[]') permission,
						IFNULL(userAddresses.address,'[]') address,
						IFNULL(lifeTimePoints,0) AS lifeTimePoints,
						IFNULL(availablePoints,0) AS availablePoints,
						IFNULL(pendingPoints.total,0) AS pendingPoints,
						defaultAddress.city,
						defaultAddress.state,
						loginExpiresOn,
						loginVerificationExpiresOn,
						IFNULL(userPaymentMethods.paymentMethods, '[]') paymentMethods
 						FROM  user 
 							LEFT JOIN (${this.userPermissionsQuery()}) as userPermissions on userPermissions.userId=user.id
 							LEFT JOIN (${this.userAddressQuery()}) as userAddresses on userAddresses.userId=user.id
							LEFT JOIN (SELECT city, state, userId FROM userAddress WHERE isDefault=1 group by userId) defaultAddress on defaultAddress.userId=user.id 
							LEFT JOIN (
								SELECT
									userId,
									SUM(pointAmount) as total
								FROM userPoint
								WHERE status='PENDING'
								GROUP BY userId
							) AS pendingPoints ON pendingPoints.userId=user.id
							LEFT JOIN (
								${User.userPaymentMethodsSubquery}
							) userPaymentMethods ON userPaymentMethods.userId=user.id
						WHERE (inactiveAfterDate IS NULL OR inactiveAfterDate > NOW()) AND permissionLogin=1 AND primaryEmail=?;`,
				[username]
			);
		} catch (e) {
			throw new RsError('NOT_FOUND', e.msg);
		}
	}

	async getByEmail(email: string): Promise<Api.User.Filtered> {
		const userArray = await this.db.runQuery('SELECT * FROM user WHERE primaryEmail=?;', [email]);
		if (!ObjectUtils.isArrayWithData(userArray)) return;
		return this.getById(userArray[0].id);
	}

	async authResetPasswordGuid(guid: string) {
		return await this.db.queryOne(
			`SELECT 
					id,
					companyId,
					tierId,
					userRoleId,
					firstName,
					lastName,
					primaryEmail,
					accountNumber,
					phone,
					notes,
					token,
					createdOn,
					modifiedOn,
					joinedOn,
					birthDate,
					lastLoginOn,
					permissionLogin,
					IFNULL(userPermissions.permission, '[]') permission,
					IFNULL(userAddresses.address,'[]') address,
					lifeTimePoints,
					availablePoints,
					defaultAddress.city,
					defaultAddress.state,
					loginExpiresOn,
					loginVerificationExpiresOn
 					FROM user 
 						LEFT JOIN (${this.userPermissionsQuery()}) as userPermissions on userPermissions.userId=user.id
 						LEFT JOIN (${this.userAddressQuery()}) as userAddresses on userAddresses.userId=user.id
						LEFT JOIN (SELECT city, state, userId FROM userAddress WHERE isDefault=1 group by userId) defaultAddress on defaultAddress.userId=user.id  
					WHERE passwordResetGuid=? AND passwordResetExpiresOn > NOW();`,
			[guid]
		);
	}

	async authVerificationLoginGuid(guid: string) {
		return await this.db.queryOne(
			`SELECT 
					id,
					companyId,
					token
 					FROM user 
					WHERE loginVerificationGuid=? AND loginVerificationExpiresOn > NOW();`,
			[guid]
		);
	}

	async confirmEmail(emailGuid: string) {
		return await this.db.queryOne(
			'SELECT id, companyId, userRoleId, primaryEmail, name, token, profilePictureUrl FROM user WHERE emailConfirmationGuid=? AND permissionLogin=1;',
			[emailGuid]
		);
	}

	async getById(userId: number): Promise<Api.User.Filtered> {
		return await this.db.queryOne(
			`SELECT 
					id,
					companyId,
					tierId,
					userRoleId,
					firstName,
					lastName,
					primaryEmail,
					accountNumber,
					phone,
					notes,
					token,
					createdOn,
					modifiedOn,
					joinedOn,
					birthDate,
					lastLoginOn,
					permissionLogin,
					IFNULL((${this.userPermissionsQuery(userId)}), '[]') permission,
					IFNULL((${this.userAddressQuery(userId)}),'[]') address,
					lifeTimePoints,
					availablePoints,
       				IFNULL(pendingPoints.total, 0) pendingPoints,
					defaultAddress.city,
					defaultAddress.state,
					loginExpiresOn,
					loginVerificationExpiresOn,
					IFNULL(userPaymentMethods.paymentMethods, '[]') paymentMethods,
       				allowEmailNotification
 					FROM user 
						LEFT JOIN (SELECT city, state, userId FROM userAddress WHERE isDefault=1 GROUP BY userId) defaultAddress on defaultAddress.userId=user.id
						LEFT JOIN (
							${User.userPaymentMethodsSubquery}
						) userPaymentMethods ON userPaymentMethods.userId=user.id
						LEFT JOIN (
						SELECT
							userId,
							SUM(pointAmount) as total
						FROM userPoint
						WHERE status='PENDING'
						GROUP BY userId
					) AS pendingPoints ON pendingPoints.userId=user.id
 					WHERE id=?;`,
			[userId]
		);
	}

	/**
	 * getUserOnlyById - Internal use only
	 * @param userId
	 * @returns Model.User
	 */
	async getUserOnlyById(userId: number) {
		return await this.db.queryOne('SELECT * FROM user WHERE id=?;', [userId]);
	}

	async getIdsWithAwardableActions(): Promise<number[]> {
		const userIds = await this.db.runQuery(
			`SELECT 
				user.id
			FROM user
				JOIN userAction ON user.id=userAction.userId
			WHERE userAction.hasAwarded <> 1
			GROUP BY user.id;`,
			[]
		);
		return userIds.map((user) => user.id);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<any> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQueryString = companyId ? mysql.format(' companyId=? AND', [companyId]) : '';
		let allObjects = await this.db.runQuery(
			`SELECT 
					id,
					companyId,
					tierId,
					userRoleId,
					firstName,
					lastName,
					primaryEmail,
					accountNumber,
					phone,
					notes,
					token,
					createdOn,
					modifiedOn,
					joinedOn,
					birthDate,
					lastLoginOn,
					permissionLogin,
					IFNULL(userPermissions.permission, '[]') permission,
					IFNULL(userAddresses.address,'[]') address,
					lifeTimePoints,
					availablePoints,
					defaultAddress.city,
					defaultAddress.state,
					loginExpiresOn,
					loginVerificationExpiresOn,
       				allowEmailNotification
 					FROM user 
 						LEFT JOIN (${this.userPermissionsQuery()}) as userPermissions on userPermissions.userId=user.id
 						LEFT JOIN (${this.userAddressQuery()}) as userAddresses on userAddresses.userId=user.id 
 						LEFT JOIN (SELECT city, state, userId FROM userAddress WHERE isDefault=1 group by userId) defaultAddress on defaultAddress.userId=user.id 
					WHERE
					${companyIdQueryString}
					${pageQuery.filterQuery}
					${pageQuery.sortQuery} 
					LIMIT ?
					OFFSET ?; SELECT Count(id) as total FROM user WHERE ${companyIdQueryString} ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	async getPasswordHash(userId: number): Promise<string> {
		const result = await this.db.queryOne(`SELECT password FROM user WHERE id=?`, [userId]);
		return result.password;
	}

	async updatePoints(userId: number, pointValue: number, pointStatus: Model.UserPointStatusTypes) {
		let lifeTimePointsToAdd: number;
		let availablePointsToAdd: number = pointValue;
		if (pointStatus === 'REFUNDED' || pointStatus === 'CANCELED') {
			lifeTimePointsToAdd = 0;
		} else if (pointStatus === 'RECEIVED' || pointStatus === 'REVOKED') {
			lifeTimePointsToAdd = pointValue;
		} else {
			lifeTimePointsToAdd = pointValue;
			if (pointValue < 0) lifeTimePointsToAdd = 0;
		}
		let user = await this.getById(userId);
		if ((user.lifeTimePoints <= 0 || user.availablePoints <= 0) && pointValue < 0) {
			lifeTimePointsToAdd = 0;
			availablePointsToAdd = 0;
		}
		if (user.availablePoints + pointValue <= 0 && pointValue < 0 && pointStatus === 'REVOKED') {
			await this.db.runQuery(
				'UPDATE user SET lifeTimePoints = lifeTimePoints+?, availablePoints = ? WHERE id=?;',
				[-user.availablePoints, 0, userId]
			);
		} else {
			await this.db.runQuery(
				'UPDATE user SET lifeTimePoints = lifeTimePoints+?, availablePoints = availablePoints+? WHERE id=?;',
				[lifeTimePointsToAdd, availablePointsToAdd, userId]
			);
		}
		return await this.getById(userId);
	}

	async getPermissionForUser(userId: number) {
		return this.db.queryOne(this.userPermissionsQuery(userId));
	}

	async getUsersTierPoints(): Promise<UsersTierPoints[]> {
		return this.db.runQuery(
			`SELECT
		       user.id userId,
		       user.primaryEmail,
		       user.lifeTimePoints,
		       user.availablePoints,
		       uT.tierId userTierId,
		       uT.createdOn userTierCreatedOn,
		       uT.expiresOn userTierExpiresOn,
		       IFNULL(usersPoints.points,'[]') points
		from user
		    LEFT JOIN userTier uT on user.id = uT.userId
		    LEFT JOIN tier t on user.tierId = t.id
		    LEFT JOIN (
		    		SELECT 
		    		userId, 
		    		CONCAT('[',
		    			GROUP_CONCAT(
		    				CONCAT('{"id":',id, 
		    				',"userActionId":', IFNULL(userActionId, '\\"\\"'), 
		    				',"orderId":', IFNULL(orderId, '\\"\\"'), 
		    				',"reservationId":', IFNULL(reservationId, '\\"\\"'), 
		    				',"description":"', IFNULL(description,''), 
		    				'","createdOn":"', createdOn, 
		    				'","modifiedOn":"', modifiedOn, 
		    				'","availableOn":"',availableOn, 
		    				'","pointType":"', pointType, 
		    				'","pointAmount":', pointAmount, 
		    				',"status":"', status, 
		    				'","reason":"', reason, 
		    				'"}')
		    				), 
		    				']'
						) points 
					FROM userPoint 
					group by userid
				) usersPoints ON user.id=usersPoints.userId;`,
			[]
		);
	}

	async getRoles(): Promise<Model.UserRole[]> {
		return this.db.runQuery(`SELECT * FROM userRole;`);
	}

	async getLoyaltyMemberRole(): Promise<Model.UserRole> {
		return this.db.queryOne('SELECT * FROM userRole WHERE name=? LIMIT 1;', ['loyalty_member']);
	}

	async getRoleByRoleId(roleId: number) {
		return await this.db.queryOne('SELECT * FROM userRole WHERE id=?;', [roleId]);
	}

	async upsertUserTier(userTier: UserTierUpdate) {
		try {
			await this.db.queryOne('SELECT * FROM userTier WHERE userId=?;', [userTier.userId]);
			return await this.db.runQuery('UPDATE userTier SET tierId=?, expiresOn=? WHERE userId=?;', [
				userTier.tierId,
				userTier.expiresOn,
				userTier.userId
			]);
		} catch (e) {
			return await this.db.runQuery('INSERT INTO userTier SET ?', [userTier]);
		}
	}

	getTierForUser(userId: number): Promise<Model.Tier> {
		return this.db.queryOne(`SELECT * FROM tier WHERE id=(SELECT tierId FROM user WHERE id=?);`, [userId]);
	}

	getMultiplierForUser(userId: number): Promise<{ multiplier: number }> {
		return this.db.queryOne(
			`SELECT multiplier 
			FROM tierMultiplier
				JOIN userTier ON tierMultiplier.tierId = userTier.tierId
			WHERE userTier.userId = ?
			ORDER BY tierMultiplier.id DESC
			LIMIT 1;`,
			[userId]
		);
	}

	getUsersByAccessScope(accessScope: Model.UserAccessScopeTypes): Promise<Model.User[]> {
		return this.db.runQuery(
			`WITH companyUserPermission AS (
                SELECT userId, \`key\`
                FROM userPermission
                GROUP BY userId
            )
             SELECT user.*
             FROM user
                      JOIN companyUserPermission ON companyUserPermission.userId = user.id
             WHERE companyUserPermission.key = ?;`,
			[accessScope]
		);
	}

	deleteForTest(userId: number) {
		return this.db.runQuery('DELETE FROM user WHERE id=?', [userId]);
	}

	private userPermissionsQuery(userId?: number) {
		if (!userId)
			return mysql.format(
				`Select userId, CONCAT('[', GROUP_CONCAT(CONCAT('{"key":"', \`key\`, '","read":', \`read\`, ',"write":', \`write\`, '}')), ']') permission from userPermission group by userId`,
				[]
			);
		return mysql.format(
			`Select CONCAT('[', GROUP_CONCAT(CONCAT('{"key":"', \`key\`, '","read":', \`read\`, ',"write":', \`write\`, '}')), ']') permission from userPermission where userId = ? group by userId`,
			[userId]
		);
	}

	private userAddressQuery(userId?: number) {
		if (!userId)
			return mysql.format(
				`Select userId, CONCAT('[', GROUP_CONCAT(CONCAT('{"id":', \`id\`, ',"name":"', IFNULL(\`name\`,''), '","type":"', \`type\`, '","address1":"', \`address1\`, '","address2":"', IFNULL(\`address2\`,''), '","city":"', IFNULL(\`city\`, ''), '","state":"', IFNULL(\`state\`,''), '","zip":', \`zip\`, ',"country":"', \`country\`, '","isDefault":', \`isDefault\`, '}')), ']') address from userAddress group by userId`,
				[]
			);
		return mysql.format(
			`Select CONCAT('[', GROUP_CONCAT(CONCAT('{"id":', \`id\`, ',"name":"', IFNULL(\`name\`,''), '","type":"', \`type\`, '","address1":"', \`address1\`, '","address2":"', IFNULL(\`address2\`,''), '","city":"', IFNULL(\`city\`, ''), '","state":"', IFNULL(\`state\`,''), '","zip":', \`zip\`, ',"country":"', \`country\`, '","isDefault":', \`isDefault\`, '}')), ']') address from userAddress WHERE userId=? group by userId`,
			[userId]
		);
	}

	private static userPaymentMethodsSubquery = `
		SELECT
            userId,
            CONCAT('[',
                GROUP_CONCAT(
                    CONCAT(
                        '{"id":',userPaymentMethod.id,
                        ',"userAddressId":',IFNULL(userAddressId,0),
                        ',"nameOnCard":"',nameOnCard,
                        '","type":"',type,
                        '","last4":',last4,
                        ',"expirationMonth":',expirationMonth,
                        ',"expirationYear":',expirationYear,
                        ',"cardNumber":"',cardNumber,
                        '","isPrimary":',isPrimary,
                        ',"createdOn":"',createdOn,
                        '","systemProvider":"',systemProvider,
                        '"}'
                    )
                ), 
            ']') AS paymentMethods
        FROM userPaymentMethod
            INNER JOIN serviceKey AS csk
				ON userPaymentMethod.systemProvider = csk.serviceName
				AND csk.serviceType = '${User.paymentServiceTypeName}'
        WHERE isDeleted = 0
        GROUP BY userId`;
}

export const user = (dbArgs) => {
	dbArgs.tableName = 'user';
	return new User(dbArgs);
};
