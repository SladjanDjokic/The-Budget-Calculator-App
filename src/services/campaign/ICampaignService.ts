import IService from '../IService';
import { CampaignToCreate } from '../../database/objects/campaign.db';

export interface CampaignUpdate extends Api.Campaign.Req.Update {
	companyId: number;
}

export interface CampaignActionValue extends Model.CampaignAction {
	userCampaignActionCount: number;
	userActionIds: number[];
}

export interface CampaignActionCount {
	[key: number]: CampaignActionValue;
}

export interface AwardPoints {
	campaignActionId: number;
	campaignPointsToAward: number;
	campaignId: number;
	actionId: number;
	userActionIds: number[];
}
export default interface ICampaignService extends IService {
	create({ actions, ...objToCreate }: CampaignToCreate): Promise<Api.Campaign.Detail>;

	update(campaignId: number, { actions, ...objToUpdate }: CampaignUpdate): Promise<Api.Campaign.Detail>;

	getById(campaignId: number, companyId?: number): Promise<Api.Campaign.Detail>;

	getManyByIds(campaignIds: number[], companyId: number): Promise<Api.Campaign.Detail[]>;

	getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId: number
	): Promise<RedSky.RsPagedResponseData<Api.Campaign.Detail>>;

	delete(campaignId: number, companyId: number): Promise<number>;

	createManyCampaignActions(
		companyId: number,
		campaignId: number,
		actionList: Api.CampaignAction.CreateMany[]
	): Promise<Model.CampaignAction[]>;

	getByCompanyId(companyId: number): Promise<Api.Campaign.Detail[]>;

	getColumns(): string[];

	consolidateUserCampaigns(userId: number, companyId: number): Promise<void>;

	getManyForCampaignActionIds(campaignActionIds: number[], companyId: number): Promise<Api.Campaign.Detail[]>;

	getActiveCampaignsByCompanyId(companyId: number): Promise<Api.Campaign.Detail[]>;

	getCampaignActionsByActionId(actionId: number, companyId?: number): Promise<Model.CampaignAction[]>;
}
