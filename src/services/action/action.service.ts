import { Service } from '../Service';
import IActionTable from '../../database/interfaces/IActionTable';
import { BrandAndLocationAction } from '../../database/interfaces/IActionTable';
import IActionService, { ActionToCreate } from './IActionService';
import { ServiceName } from '../serviceFactory';

export default class ActionService extends Service implements IActionService {
	constructor(readonly actionTable: IActionTable) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {}

	create(actionToCreate: ActionToCreate): Promise<Api.Action.Res.Get> {
		return this.actionTable.create(actionToCreate);
	}

	getById(actionId: number, companyId?: number): Promise<Api.Action.Res.Get> {
		return this.actionTable.getById(actionId, companyId);
	}

	getManyByIds(actionIds: number[], companyId?: number): Promise<Api.Action.Res.Get[]> {
		return this.actionTable.getManyByIds(actionIds, companyId);
	}

	getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Action.Res.Get>> {
		return this.actionTable.getByPage(pagination, sort, filter, companyId);
	}

	getDetailsById(actionId: number, companyId?: number): Promise<Api.Action.Res.Details> {
		return this.actionTable.getDetailsById(actionId, companyId);
	}

	update(actionId: number, updateObject: Api.Action.Req.Update, companyId: number): Promise<Api.Action.Res.Get> {
		return this.actionTable.update(actionId, updateObject, companyId);
	}

	async delete(actionId: number, companyId: number): Promise<number> {
		await this.actionTable.delete(actionId, companyId);
		return actionId;
	}

	getBrandAndLocationActions(companyId: number): Promise<BrandAndLocationAction[]> {
		return this.actionTable.getBrandAndLocationActions(companyId);
	}
}
