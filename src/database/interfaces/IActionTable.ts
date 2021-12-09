import { ActionToCreate } from '../../services/action/IActionService';
import ITable from '../ITable';

export interface BrandAndLocationAction {
	id: number;
	name: string;
	pointValue: number;
	brandDetails: BrandAndLocation[];
}

export interface BrandAndLocation {
	id: number;
	name: string;
	externalId: string;
	metaData: any;
	locations: {
		id: number;
		name: string;
		isActive: 0 | 1;
		externalId: string;
		metaData: any;
	}[];
}

export default interface IActionTable extends ITable {
	columns: string[];
	create: (action: ActionToCreate) => Promise<Api.Action.Res.Get>;
	getById: (actionId: number, companyId?: number) => Promise<Api.Action.Res.Get>;
	getDetailsById: (actionId: number, companyId?: number) => Promise<Api.Action.Res.Details>;
	update: (actionId: number, actionToUpdate: Api.Action.Req.Update, companyId: number) => Promise<Api.Action.Res.Get>;

	getBrandAndLocationActions(companyId: number): Promise<BrandAndLocationAction[]>;
}
