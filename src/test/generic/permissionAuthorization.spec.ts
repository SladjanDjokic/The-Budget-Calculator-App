import UserService from '../../services/user/user.service';
import serviceFactory from '../../services/serviceFactory';
import chai from 'chai';
import permissionAuthorizationResource from '../resources/permissionAuthorization.resource';
import Axios from '../../utils/axios/Axios';
import { ObjectUtils } from '../../utils/utils';

describe('Permission Authorization tests', function () {
	let userService: UserService;
	let axios: Axios;
	before(function () {
		userService = serviceFactory.get<UserService>('UserService');
		axios = new Axios();
	});
	it('should allow user access to the endpoint with USER permission', async function () {
		const localUser: Api.User.Filtered = await userService.getById(permissionAuthorizationResource.userId);
		const apiResponse: { data: Api.User.Filtered } = await axios.get(
			`${permissionAuthorizationResource.baseUrl}/api/v1/user?id=${localUser.id}`,
			{
				headers: { token: localUser.token, 'company-id': localUser.companyId }
			}
		);
		chai.expect(apiResponse).to.exist;
		chai.expect(apiResponse.data).to.be.an('object');
		chai.expect(apiResponse.data).to.haveOwnProperty('id');
		chai.expect(apiResponse.data.id).to.equal(localUser.id);
	});
	it('should FAIL in user access to the endpoint with no TEST permission', async function () {
		const localUser: Api.User.Filtered = await userService.getById(permissionAuthorizationResource.userId);
		try {
			await axios.get(
				`${permissionAuthorizationResource.baseUrl}/api/v1/user/authorization/fail?id=${localUser.id}`,
				{
					headers: { token: localUser.token, 'company-id': localUser.companyId }
				}
			);
		} catch (e) {
			const rsError: RedSky.RsErrorData = ObjectUtils.smartParse(e.msg);
			chai.expect(rsError.err).to.exist;
			chai.expect(rsError.err).to.equal('UNAUTHORIZED');
			chai.expect(rsError).to.haveOwnProperty('msg');
		}
	});
});
