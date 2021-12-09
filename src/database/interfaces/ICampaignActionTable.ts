import ITable from '../ITable';

export interface CampaignActionCreate extends Api.CampaignAction.Create {
	companyId: number;
}

export default interface ICampaignActionTable extends ITable {
	columns: string[];
	createManyActionsForCampaign: (
		campaignId: number,
		actions: Api.CampaignAction.CreateMany[]
	) => Promise<Model.CampaignAction[]>;
	getByCampaignId: (campaignId: number) => Promise<Model.CampaignAction[]>;
	getByActionId: (actionId: number) => Promise<Model.CampaignAction[]>;
	getActiveByIds: (ids: number[]) => Promise<Model.CampaignAction[]>;
}
