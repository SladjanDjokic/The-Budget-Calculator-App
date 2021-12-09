import { BrandAndLocationAction } from '../../database/interfaces/IActionTable';
import IService from '../IService';

export interface ActionToCreate extends Api.Action.Req.Create {
	companyId: number;
}

export default interface IActionService extends IService {
	create: (actionToCreate: ActionToCreate) => Promise<Api.Action.Res.Get>;

	getById: (actionId: number, companyId?: number) => Promise<Api.Action.Res.Get>;

	getManyByIds: (actionIds: number[], companyId?: number) => Promise<Api.Action.Res.Get[]>;

	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	) => Promise<RedSky.RsPagedResponseData<Api.Action.Res.Get>>;

	getDetailsById: (actionId: number, companyId?: number) => Promise<Api.Action.Res.Details>;

	update: (actionId: number, updateObject: Api.Action.Req.Update, companyId: number) => Promise<Api.Action.Res.Get>;

	delete: (actionId: number, companyId: number) => Promise<number>;

	getBrandAndLocationActions: (companyId: number) => Promise<BrandAndLocationAction[]>;
}
