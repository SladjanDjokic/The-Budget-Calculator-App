import serviceFactory from '../services/serviceFactory';
import UserService from '../services/user/user.service';
import redisClient from '../integrations/redis/client';
import { ObjectUtils } from '../utils/utils';

const redisRolesKey: string = 'roles';

export async function companyUserRole(req, res, next) {
	let userRoles: any = await redisClient.get(redisRolesKey);
	if (userRoles) {
		req.roles = ObjectUtils.smartParse(userRoles);
		return next();
	}
	userRoles = await serviceFactory.get<UserService>('UserService').getRoles();
	req.roles = userRoles;
	await redisClient.set(redisRolesKey, userRoles);
	next();
}
