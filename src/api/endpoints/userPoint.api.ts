import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import { RsError } from '../../utils/errors';
import serviceFactory from '../../services/serviceFactory';
import UserPointService from '../../services/userPoint/userPoint.service';
import { boundMethod } from 'autobind-decorator';
import SystemActionLogService from '../../services/systemActionLog/systemActionLog.service';
import accessScopes from '../../@decorators/accessScopes';
import { ObjectUtils } from '../../utils/utils';

export default class UserPointApi extends GeneralApi {
	userPointService: UserPointService;
	systemActionLog: SystemActionLogService;
	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.app.post(pre, this.create);
		this.app.get(pre, this.get);
		this.app.get(`${pre}/paged`, this.getByPage);

		this.userPointService = serviceFactory.get<UserPointService>('UserPointService');
		this.systemActionLog = serviceFactory.get<SystemActionLogService>('SystemActionLogService');
	}

	@boundMethod
	@accessScopes('USER_POINTS')
	async create(req: RsRequest<Api.UserPoint.Req.Create>, res: RsResponse<Api.UserPoint.Res.Get>) {
		let obj = this.getCreateObjectFromRequest(req, this.userPointService.userPointTable.columns);
		const pointAward = ObjectUtils.toBoolean(req.data.award);
		if (pointAward) obj.status = 'RECEIVED';
		else obj.status = 'REVOKED';
		let createdObj = ((await this.userPointService.create(obj)) as unknown) as Api.UserPoint.Res.Get;
		this.systemActionLog.create({
			...this.systemActionLog.formatApiLogItem(req),
			action: 'CREATE',
			source: this.userPointService.userPointTable.tableName,
			sourceId: createdObj.id
		});
		res.sendData(createdObj);
	}

	@boundMethod
	@accessScopes('USER_POINTS')
	async get(req: RsRequest<Api.UserPoint.Req.Get>, res: RsResponse<Api.UserPoint.Res.Get | Api.UserPoint.Res.Get[]>) {
		if (req.data.id) {
			let obj = ((await this.userPointService.getById(req.data.id)) as unknown) as Api.UserPoint.Res.Get;
			res.sendData(obj);
		} else if (req.data.ids) {
			let objs = await this.userPointService.getManyByIds(req.data.ids);
			res.sendData(objs);
		} else throw new RsError('BAD_REQUEST');
	}

	@boundMethod
	@accessScopes('USER_POINTS')
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.UserPoint.Res.Get[]>) {
		let pageDetails = this.pageFilterData(req.data);
		let userPointsPaged: RedSky.RsPagedResponseData<
			Api.UserPoint.Res.Get[]
		> = await this.userPointService.getByPage(pageDetails.pagination, pageDetails.sort, pageDetails.filter);
		res.sendPaginated(userPointsPaged.data, userPointsPaged.total);
	}
}
