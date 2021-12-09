import ICampaignTable from '../interfaces/ICampaignTable';
import { CampaignToCreate } from '../objects/campaign.db';
import { DateUtils } from '../../utils/utils';
import RsPagedResponseData = RedSky.RsPagedResponseData;
import TableMock from './table.db.mock';

export default class CampaignTableMock extends TableMock implements ICampaignTable {
	createCount = 0;
	lastId = 0;

	constructor(private campaigns: Model.Campaign[] = [], private campaignActions: Model.CampaignAction[] = []) {
		super();
	}

	columns: [
		'id',
		'companyId',
		'segmentId',
		'name',
		'description',
		'createdOn',
		'modifiedOn',
		'isActive',
		'maxReward',
		'type',
		'startOn',
		'endOn',
		'pointValueMultiplier'
	];

	async create({ description, ...objToCreate }: CampaignToCreate): Promise<Api.Campaign.Detail> {
		this.createCount++;
		const createdCampaign: Api.Campaign.Detail = {
			activityReferenceNumber: null,
			...objToCreate,
			id: ++this.lastId,
			description,
			segmentId: null,
			actions: this.buildActions(this.campaignActions),
			createdOn: DateUtils.dbNow(),
			modifiedOn: DateUtils.dbNow(),
			isActive: 1,
			completionPoints: 5000
		};
		this.campaigns.push(createdCampaign);
		return createdCampaign;
	}

	async update(campaignId: number, objToUpdate: Api.Campaign.Req.Update): Promise<Api.Campaign.Detail> {
		let campaignIndex = this.campaigns.findIndex((campaign) => campaign.id === campaignId);
		this.campaigns[campaignIndex] = { ...this.campaigns[campaignIndex], ...objToUpdate };
		return {
			...this.campaigns[campaignIndex],
			actions: this.buildActions(this.campaignActions.filter((action) => action.campaignId === campaignId))
		};
	}

	async getById(campaignId: number, companyId?: number): Promise<Api.Campaign.Detail> {
		let campaign = this.campaigns.find((campaign) => campaign.id === campaignId);
		return {
			...campaign,
			actions: this.buildActions(this.campaignActions.filter((action) => action.campaignId === campaignId))
		};
	}

	async getManyByIds(campaignIdList: number[], companyId?: number): Promise<Api.Campaign.Detail[]> {
		let campaignsById = this.campaigns.filter((campaign) => campaignIdList.includes(campaign.id));
		return campaignsById.map((campaign) => {
			return {
				...campaign,
				actions: this.buildActions(this.campaignActions.filter((action) => action.campaignId === campaign.id))
			};
		});
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId: number
	): Promise<RsPagedResponseData<Api.Campaign.Detail[]>> {
		// TODO: fix this. its not correct but I don't have time to fix
		//@ts-ignore
		return { data: this.campaigns, total: this.createCount };
	}

	async getByCompanyId(companyId: number): Promise<Api.Campaign.Detail[]> {
		let companyCampaigns = this.campaigns.filter((campaign) => campaign.companyId === companyId);
		return companyCampaigns.map((campaign) => {
			return {
				...campaign,
				actions: this.buildActions(this.campaignActions.filter((action) => action.campaignId === campaign.id))
			};
		});
	}

	async getManyForCampaignActionIds(campaignActionIds: number[], companyId: number): Promise<Api.Campaign.Detail[]> {
		const response: Api.Campaign.Detail[] = [];
		for (let index in this.campaignActions) {
			if (
				campaignActionIds.includes(this.campaignActions[index].id) &&
				!response.find((campaign) => campaign.id === this.campaignActions[index].campaignId)
			) {
				const campaignToFind = this.campaigns.find(
					(campaign) => campaign.id === this.campaignActions[index].campaignId
				);
				const campaignToAdd: Api.Campaign.Detail = {
					...campaignToFind,
					actions: this.buildActions(
						this.campaignActions.filter((action) => action.campaignId === campaignToFind.id)
					)
				};
				response.push(campaignToAdd);
			}
		}
		return response;
	}

	async deactivate(campaignId: number, companyId: number): Promise<void> {
		const index = this.campaigns.findIndex((campaign) => campaign.id === campaignId);
		this.campaigns[index].isActive = 0;
	}

	updateMany: null;
	deleteMany: null;

	private buildActions(campaignActions: Model.CampaignAction[]): Api.Campaign.Action[] {
		return campaignActions.map((campaignAction) => {
			return {
				...campaignAction,
				id: campaignAction.actionId,
				name: '',
				createdOn: '',
				description: '',
				modifiedOn: '',
				type: '',
				brandId: 0,
				brandLocationId: 0,
				campaignActionId: campaignAction.id
			};
		});
	}
}
