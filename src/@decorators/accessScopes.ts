import { RsRequest } from '../@types/expressCustom';
import { RsError } from '../utils/errors';
import { ObjectUtils } from '../utils/utils';

export default function accessScopes(...accessScopes: Model.UserAccessScopeTypes[]) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const functionMethod = descriptor.value;
		descriptor.value = async function (...args: any) {
			const req = args[0] as RsRequest<any>;
			// Users can do anything to themselves
			if (!!req.isSelf) return await functionMethod.apply(this, args);
			const requestMethod = req.method;
			if (!req?.user?.permission) throw new RsError('UNAUTHORIZED', 'Operation is not authorized');
			const usersPermissions = (ObjectUtils.smartParse(req.user.permission) as Api.User.Permission[]) || [];
			const userPermissionMap = ObjectUtils.group(usersPermissions, 'key');
			if (
				accessScopes.some((permission) => {
					const userPermission = ObjectUtils.isArrayWithData(userPermissionMap[permission])
						? userPermissionMap[permission][0]
						: null;
					if (!userPermission) return;
					if (requestMethod === 'GET') {
						return !!(userPermission.read || userPermission.write);
					} else {
						return !!userPermission.write;
					}
				})
			)
				return await functionMethod.apply(this, args);
			throw new RsError('UNAUTHORIZED', 'Operation is not authorized');
		};
	};
}
