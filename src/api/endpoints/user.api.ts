import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import { RsError } from '../../utils/errors';
import serviceFactory from '../../services/serviceFactory';
import UserService from '../../services/user/user.service';
import CompanyService from '../../services/company/company.service';
import { StringUtils, WebUtils } from '../../utils/utils';
import { boundMethod } from 'autobind-decorator';
import accessScopes from '../../@decorators/accessScopes';
import roleAuthorization from '../../@decorators/roleAuthorization';
import UserPointService from '../../services/userPoint/userPoint.service';
import publicUrl from '../../@decorators/publicUrl';

export default class UserApi extends GeneralApi {
	userService: UserService;
	companyService: CompanyService;
	userPointService: UserPointService;

	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;
		this.app.post(pre, this.create);
		this.app.get(pre, this.get);
		this.app.get(pre + '/detail', this.getDetails);
		this.app.get(`${pre}/paged`, this.getByPage);
		this.app.put(pre, this.update);
		this.app.delete(pre, this.delete);
		this.app.put(`${pre}/reactivate`, this.reactivate);
		this.app.get(`${pre}/roles`, this.getRoles);
		this.app.post(pre + '/login', this.login);
		this.app.post(pre + '/password/forgot', this.forgotPassword);
		this.app.get(pre + '/with/token', this.getWithToken);
		this.app.put(pre + '/password/reset', this.resetPassword);
		this.app.put(pre + '/password/guid/valid', this.validatePasswordResetGuid);
		this.app.put(`${pre}/password`, this.updatePassword);
		this.app.get(pre + '/domain', this.getDomainForEmail);
		this.app.get(pre + '/confirm', this.confirmEmail);
		this.app.get(pre + '/authorization/fail', this.authorizationFails);
		this.app.get(pre + '/login/verify', this.verifyUserLogin);
		this.app.get(pre + '/points', this.getUserPoints);

		this.userService = serviceFactory.get('UserService');
		this.companyService = serviceFactory.get('CompanyService');
		this.userPointService = serviceFactory.get<UserPointService>('UserPointService');
	}

	@boundMethod
	async getWithToken(req: RsRequest<Api.User.Req.Get>, res: RsResponse<Api.User.Res.Login>) {
		res.sendData(await this.userService.getByToken(req.user));
	}

	@boundMethod
	@publicUrl('POST', '/user/login')
	async login(req: RsRequest<Api.User.Req.Login>, res: RsResponse<Api.User.Res.Login>) {
		let result: Api.User.Res.Login;
		if (!!req.headers['admin-portal'])
			result = await this.userService.loginAdminPortal(req.data.username, req.data.password, req.hostname);
		else result = await this.userService.login(req.data.username, req.data.password);
		res.sendData(result);
	}

	@boundMethod
	@accessScopes('USER')
	async create(req: RsRequest<Api.User.Req.Create>, res: RsResponse<Api.User.Filtered>) {
		const createdObj: Api.User.Filtered = await this.userService.create(
			req.data,
			req.hostname,
			WebUtils.getCompanyId(req)
		);
		res.sendData(createdObj);
	}

	@boundMethod
	@roleAuthorization('self', 'admin')
	@accessScopes('USER')
	async get(req: RsRequest<Api.User.Req.Get>, res: RsResponse<Api.User.Res.Get>) {
		if (req.data.id) {
			let obj: Api.User.Res.Get = ((await this.userService.getById(req.data.id)) as unknown) as Api.User.Res.Get;
			res.sendData(obj);
		} else if (req.data.ids) {
			let objs = await this.userService.getManyByIds(req.data.ids);
			res.sendData(objs);
		} else throw new RsError('BAD_REQUEST');
	}

	@boundMethod
	@roleAuthorization('self')
	async getDetails(req: RsRequest<void>, res: RsResponse<Api.User.Res.Detail>) {
		const user = await this.userService.getUserDetails(req.user.id);
		res.sendData(user);
	}

	@boundMethod
	@accessScopes('USER')
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.User.Res.GetByPage>) {
		let pageDetails = this.pageFilterData(req.data);
		let userPagedResponse: RedSky.RsPagedResponseData<Api.User.Res.GetByPage> = await this.userService.getByPage(
			pageDetails.pagination,
			pageDetails.sort,
			pageDetails.filter
		);
		res.sendPaginated(userPagedResponse.data, userPagedResponse.total);
	}

	@boundMethod
	@roleAuthorization('self', 'admin')
	@accessScopes('USER')
	async update(req: RsRequest<Api.User.Req.Update>, res: RsResponse<Api.User.Res.Get>) {
		if (req.user.id === req.data.id && !(await this.userService.isAdminOrAbove(req.user)) && req.data.userRoleId)
			throw new RsError('FORBIDDEN', 'You cannot update your own role');
		if (req.data.id) {
			let updateApiBody = req.data as RedSky.RsUpdateSingle;
			let updatedObjIdResponse: Api.User.Res.Get = ((await this.userService.update(
				updateApiBody.id,
				updateApiBody
			)) as unknown) as Api.User.Res.Get;
			res.sendData(updatedObjIdResponse);
		} else if (req.data.ids) {
			let updatedObjIdsResponse = await this.userService.updateMany(req.data.ids, req.data);
			res.sendData(updatedObjIdsResponse);
		} else throw new RsError('BAD_REQUEST');
	}

	@boundMethod
	@roleAuthorization('admin')
	@accessScopes('USER')
	async delete(req: RsRequest<Api.User.Req.Delete>, res: RsResponse<boolean>) {
		if (req.data.id) {
			let deletedObjIdResponse = await this.userService.delete(req.data.id);
			res.sendData(deletedObjIdResponse);
		} else if (req.data.ids) {
			let result = await this.userService.deleteMany(req.data.ids);
			res.sendData(result);
		} else throw new RsError('BAD_REQUEST');
	}

	@boundMethod
	@roleAuthorization('admin')
	@publicUrl('PUT', 'user/reactivate')
	@accessScopes('USER')
	async reactivate(req: RsRequest<{ id: number }>, res: RsResponse<boolean>) {
		let reactivateObjIdResponse = await this.userService.reactivate(req.data.id);
		res.sendData(reactivateObjIdResponse);
	}

	@boundMethod
	@publicUrl('POST', '/user/password/forgot')
	async forgotPassword(req: RsRequest<Api.User.Req.ForgotPassword>, res: RsResponse<boolean>) {
		let result = await this.userService.forgotPassword(
			req.data.primaryEmail,
			req.hostname,
			!!req.headers[`admin-portal`]
		);
		res.sendData(result);
	}

	@boundMethod
	@publicUrl('PUT', '/user/password/reset')
	async resetPassword(
		req: RsRequest<Api.User.Req.ResetPassword>,
		res: RsResponse<Omit<Api.User.Filtered, 'password'>>
	) {
		let result: Omit<Api.User.Filtered, 'password'> = await this.userService.resetPassword(
			req.data.passwordResetGuid,
			req.data.newPassword
		);
		res.sendData(result);
	}

	@boundMethod
	@publicUrl('PUT', '/user/password/guid/valid')
	async validatePasswordResetGuid(req: RsRequest<Api.User.Req.ValidateGuid>, res: RsResponse<boolean>) {
		let result = await this.userService.validatePasswordResetGuid(req.data.guid);
		res.sendData(result);
	}

	@boundMethod
	async updatePassword(req: RsRequest<Api.User.Req.UpdatePassword>, res: RsResponse<boolean>) {
		let result = await this.userService.updatePassword(
			req.user.id,
			req.data.old,
			req.data.new,
			WebUtils.getCompanyId(req)
		);
		res.sendData(result);
	}

	@boundMethod
	@publicUrl('GET', '/user/domain')
	async getDomainForEmail(req: RsRequest<Api.User.Req.UserEmail>, res: RsResponse<Api.User.Res.Company>) {
		if (!req.data.primaryEmail) throw new RsError('BAD_REQUEST', 'Missing user email');
		let rootDomain = WebUtils.getDomain(req.data.primaryEmail as string);
		let companyId: number;
		try {
			let company: Model.Company = await this.companyService.getByDomain(rootDomain);
			companyId = company.id;
		} catch (e) {
			if (!companyId) {
				if (e.err === 'NOT_FOUND') throw new RsError('NOT_FOUND', 'No domain found.');
				throw e;
			}
		}
		res.sendData({ companyId });
	}

	@boundMethod
	@publicUrl('GET', '/user/confirm')
	async confirmEmail(req: RsRequest<Api.User.Req.ValidateGuid>, res: RsResponse<any>) {
		if (!req.data.guid) throw new RsError('BAD_REQUEST', 'Missing confirmation GUID');

		// For a good experience in the web browser we want to catch errors and redirect to a success
		// or an error HTML page. For now just generate a website. Eventually just have it redirect to
		// a good look page on the app.
		try {
			await this.userService.confirmEmail(req.data.guid as string);
			const file = `<!DOCTYPE html>
							<html lang="en">
							<head>
								<title>Email Confirmed</title>
							</head>
							<body>
								Congratulations your email has been confirmed...loading site to login
							<script type="text/javascript">
								setTimeout(function() {
									window.location = "https://spireloyalty.com";
								}, 2000);
							</script>
							</body>
							</html>
							`;
			res.type('html').send(file);
		} catch (e) {
			const file = `<!DOCTYPE html>
							<html lang="en">
							<head>
								<title>Email Confirmation Failure</title>
							</head>
							<body>
								An error occurred attempting to confirm this email address....loading site.
							<script type="text/javascript">
								setTimeout(function() {
									window.location = "https://spireloyalty.com";
								}, 2000);
							</script>
							</body>
							</html>
							`;
			res.type('html').send(file);
		}
	}

	@boundMethod
	@accessScopes('USER')
	async getRoles(req: RsRequest<Api.User.Req.Role>, res: RsResponse<Api.User.Res.Role[]>) {
		const userRoles: Model.UserRole[] = await this.userService.getRoles();
		res.sendData(userRoles);
	}

	@boundMethod
	@publicUrl('GET', '/user/login/verify')
	async verifyUserLogin(req: RsRequest<Api.User.Req.VerifyLogin>, res: RsResponse<Api.User.Req.VerifyLogin>) {
		try {
			const verifiedUser: Api.User.Filtered = await this.userService.verifyLogin(req.data.guid);
			res.redirect(307, `http://${req.headers.host}?appUserToken=${verifiedUser.token}`);
		} catch (e) {
			if (e.err === 'NOT_FOUND') return res.redirect(307, `${req.headers.host}/login/verify/expired`);
			throw e;
		}
	}

	@boundMethod
	async getUserPoints(
		req: RsRequest<Api.User.Req.UserPoints>,
		res: RsResponse<Api.User.Res.UserPoint[] | Api.UserPoint.Res.Verbose[]>
	) {
		let userPoints: Api.User.Res.UserPoint[] | Api.UserPoint.Res.Verbose[];
		if (req.headers['admin-portal']) userPoints = await this.userPointService.getByUserId(req.data.userId);
		else userPoints = await this.userPointService.getVerbosePointDetails(req.user.id);
		res.sendData(userPoints);
	}

	/**
	 * authorization fails is an endpoint specifically to test failing api call. DO NOT MESS WITH OR REMOVE
	 * @param req
	 * @param res
	 * @returns - Should only ever throw in decorator method
	 */
	@boundMethod
	@accessScopes('TEST')
	async authorizationFails(req: RsRequest<Api.User.Req.Get>, res: RsResponse<any>) {
		res.sendData(false);
	}
}
