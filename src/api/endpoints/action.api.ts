import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import { RsError } from '../../utils/errors';
import serviceFactory from '../../services/serviceFactory';
import { boundMethod } from 'autobind-decorator';
import ActionService from '../../services/action/action.service';
import accessScopes from '../../@decorators/accessScopes';
import TriggerService from '../../services/trigger/trigger.service';
import { WebUtils } from '../../utils/utils';
type KeysToSanitize = 'companyId';
export default class ActionApi extends GeneralApi {
	actionService: ActionService;
	triggerService: TriggerService;

	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.app.post(pre, this.create);
		this.app.get(pre, this.get);
		this.app.get(`${pre}/paged`, this.getByPage);
		this.app.put(pre, this.update);
		this.app.delete(pre, this.delete);
		this.app.post(`${pre}/fulfill`, this.fulfillAction);

		this.actionService = serviceFactory.get<ActionService>('ActionService');
		this.triggerService = serviceFactory.get<TriggerService>('TriggerService');
	}

	@boundMethod
	@accessScopes('ADMINISTRATION', 'LOYALTY_CAMPAIGNS')
	async create(req: RsRequest<Api.Action.Req.Create>, res: RsResponse<Api.Action.Res.Get>) {
		const obj = this.getCreateObjectFromRequest(req, this.actionService.actionTable.columns);
		const createdObj = await this.actionService.create({
			...obj,
			companyId: WebUtils.getCompanyId(req)
		});
		const keyNamesToSanitize: KeysToSanitize[] = ['companyId'];
		res.sendData(WebUtils.sanitize(createdObj, keyNamesToSanitize));
	}

	@boundMethod
	@accessScopes('ADMINISTRATION', 'LOYALTY_CAMPAIGNS')
	async get(req: RsRequest<Api.Action.Req.Get>, res: RsResponse<Api.Action.Res.Get | Api.Action.Res.Get[]>) {
		const keyNamesToSanitize: KeysToSanitize[] = ['companyId'];
		if (req.data.id) {
			let action: Api.Action.Res.Get = await this.actionService.getById(req.data.id, WebUtils.getCompanyId(req));
			res.sendData(WebUtils.sanitize(action, keyNamesToSanitize));
		} else if (req.data.ids) {
			const actionsList: Api.Action.Res.Get[] = await this.actionService.getManyByIds(
				req.data.ids,
				WebUtils.getCompanyId(req)
			);
			const sanitizedActions = actionsList.map((a) => WebUtils.sanitize(a, keyNamesToSanitize));
			res.sendData(sanitizedActions);
		} else throw new RsError('BAD_REQUEST', 'Missing id or ids');
	}

	@boundMethod
	@accessScopes('ADMINISTRATION', 'LOYALTY_CAMPAIGNS')
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Action.Res.Get>) {
		let pageDetails = this.pageFilterData(req.data);
		let pagedActions: RedSky.RsPagedResponseData<Api.Action.Res.Get> = await this.actionService.getByPage(
			pageDetails.pagination,
			pageDetails.sort,
			pageDetails.filter,
			WebUtils.getCompanyId(req)
		);
		res.sendPaginated(pagedActions.data, pagedActions.total);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION', 'LOYALTY_CAMPAIGNS')
	async update(req: RsRequest<Api.Action.Req.Update>, res: RsResponse<Api.Action.Res.Get>) {
		let updatedObjIdResponse = await this.actionService.update(req.data.id, req.data, WebUtils.getCompanyId(req));
		const keyNamesToSanitize: KeysToSanitize[] = ['companyId'];
		res.sendData(WebUtils.sanitize(updatedObjIdResponse, keyNamesToSanitize));
	}

	@boundMethod
	@accessScopes('ADMINISTRATION', 'LOYALTY_CAMPAIGNS')
	async delete(req: RsRequest<Api.Action.Req.Delete>, res: RsResponse<number>) {
		let deletedObjIdResponse: number = await this.actionService.delete(req.data.id, WebUtils.getCompanyId(req));
		res.sendData(deletedObjIdResponse);
	}

	@boundMethod
	async fulfillAction(req: RsRequest<Api.Action.Req.Fulfill>, res: RsResponse<boolean>) {
		const firedTrigger: boolean = await this.triggerService.fireActionForUser(
			req.user.id,
			req.data.actionId,
			WebUtils.getCompanyId(req)
		);
		res.sendData(firedTrigger);
	}
}
