import ITable from '../ITable';

export default interface ICampaignTable extends ITable {
	columns: string[];
	getByCompanyId: (companyId: number) => Promise<Api.Campaign.Detail[]>;
	getManyForCampaignActionIds: (campaignActionIds: number[], companyId?: number) => Promise<Api.Campaign.Detail[]>;
	deactivate: (campaignId: number, companyId: number) => Promise<void>;
}
