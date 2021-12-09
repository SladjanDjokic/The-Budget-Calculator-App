import { Service } from '../Service';
import { CampaignToCreate } from '../../database/objects/campaign.db';
import { CampaignUpdate } from './ICampaignService';
import ICampaignTable from '../../database/interfaces/ICampaignTable';
import ICampaignActionTable from '../../database/interfaces/ICampaignActionTable';
import { ServiceName } from '../serviceFactory';

export default class CampaignServiceMock extends Service {
	constructor(readonly campaignTable: ICampaignTable, readonly campaignActionTable: ICampaignActionTable) {
		super();
	}

	start(services: { [key in ServiceName]?: Service }) {}

	async create({ actions, ...objToCreate }: CampaignToCreate): Promise<Api.Campaign.Detail> {
		return;
	}

	async update(campaignId: number, { actions, ...objToUpdate }: CampaignUpdate): Promise<Api.Campaign.Detail> {
		return;
	}

	getById(campaignId: number, companyId?: number): Promise<Api.Campaign.Detail> {
		return this.campaignTable.getById(campaignId);
	}

	getManyByIds(campaignIds: number[], companyId: number): Promise<Api.Campaign.Detail[]> {
		return;
	}

	getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId: number
	): Promise<RedSky.RsPagedResponseData<Api.Campaign.Detail>> {
		return;
	}

	async delete(campaignId: number, companyId: number): Promise<number> {
		return campaignId;
	}

	async createManyCampaignActions(
		companyId: number,
		campaignId: number,
		actionList: Api.CampaignAction.CreateMany[]
	): Promise<Model.CampaignAction[]> {
		return;
	}

	getByCompanyId(companyId: number): Promise<Api.Campaign.Detail[]> {
		return;
	}

	getColumns(): string[] {
		return;
	}

	async consolidateUserCampaigns(userId: number, companyId: number): Promise<void> {
		return;
	}

	getManyForCampaignActionIds(campaignActionIds: number[], companyId: number): Promise<Api.Campaign.Detail[]> {
		return;
	}

	async getActiveCampaignsByCompanyId(companyId: number): Promise<Api.Campaign.Detail[]> {
		return;
	}

	getCampaignActionsByActionId(actionId: number, companyId: number): Promise<Model.CampaignAction[]> {
		return;
	}
}
