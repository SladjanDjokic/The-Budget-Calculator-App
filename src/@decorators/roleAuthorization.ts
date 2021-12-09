import { RsRequest } from '../@types/expressCustom';
import { RsError } from '../utils/errors';

export type RoleAuthorizationTypes = 'self' | 'anonymous' | 'admin';
const validSelfMethods = ['DELETE', 'PUT', 'POST'];

export default function roleAuthorization(...roles: RoleAuthorizationTypes[]) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const method = descriptor.value;
		descriptor.value = async function (...args: any) {
			const req = args[0] as RsRequest<any>;
			const companyUserRoles: Model.UserRole[] = req.roles;
			const userMakingRequestRoleId = req?.user?.userRoleId;
			const companyAdminRoles = companyUserRoles.filter((userRole) => {
				return userRole.isAdmin;
			});
			const companyAdminRoleIds: number[] = companyAdminRoles.map((userRole) => {
				return userRole.id;
			});
			if (roles.includes('admin') && companyAdminRoleIds.includes(userMakingRequestRoleId))
				return await method.apply(this, args);
			else if (roles.includes('self')) {
				// Allow user update his/her own information
				const userId = req.user.id || 0;
				if (validSelfMethods.includes(req.method) && userId && !('userId' in req.data)) {
					req.isSelf = true;
					return await method.apply(this, args);
				}
				if (userId === req.data.id || userId === req.data.userId) {
					req.isSelf = true;
					return await method.apply(this, args);
				}
			}

			throw new RsError('UNAUTHORIZED', 'Operation is not authorized');
		};
	};
}
