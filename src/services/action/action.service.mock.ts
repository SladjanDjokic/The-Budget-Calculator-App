import { Service } from '../Service';
import { BrandAndLocationAction } from '../../database/interfaces/IActionTable';
import IActionService, { ActionToCreate } from './IActionService';

export default class ActionServiceMock extends Service implements IActionService {
	actions: Model.Action[];
	campaignActions: Model.CampaignAction[];
	campaign: Model.Campaign;
	constructor(actions: Model.Action[] = [], campaignActions: Model.CampaignAction[] = [], campaign: Model.Campaign) {
		super();
		this.actions = actions;
		this.campaignActions = campaignActions;
		this.campaign = campaign;
	}

	start() {}

	create(objToCreate: ActionToCreate): Promise<Api.Action.Res.Get> {
		return;
	}

	getById(actionId: number, companyId: number): Promise<Api.Action.Res.Get> {
		return;
	}

	getManyByIds(actionIds: number[], companyId: number): Promise<Api.Action.Res.Get[]> {
		return;
	}

	getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId: number
	): Promise<RedSky.RsPagedResponseData<Api.Action.Res.Get>> {
		return;
	}

	async getDetailsById(actionId: number, companyId: number): Promise<Api.Action.Res.Details> {
		const brand: Model.Brand = {
			companyId: 0,
			createdOn: undefined,
			description: '',
			externalId: '',
			id: 0,
			metaData: undefined,
			modifiedOn: undefined,
			name: '',
			squareLogoUrl: '',
			website: '',
			wideLogoUrl: ''
		};
		const brandLocation: Model.BrandLocation = {
			address1: '',
			address2: '',
			brandId: 0,
			city: '',
			country: '',
			externalId: '',
			id: 0,
			isActive: undefined,
			metaData: undefined,
			name: '',
			state: '',
			zip: ''
		};
		let sortedCampaigns: Api.Action.Res.CampaignDetails[] = this.campaignActions
			.filter((campaignAction) => campaignAction.actionId === actionId)
			.map((campaignAction) => {
				return {
					campaignActionId: campaignAction.actionId,
					actionCount: campaignAction.actionCount,
					id: this.campaign.id,
					segmentId: 0,
					name: this.campaign.name,
					description: '',
					createdOn: '',
					modifiedOn: '',
					isActive: 1,
					maxReward: this.campaign.maxReward,
					type: this.campaign.type,
					startOn: '',
					endOn: '',
					pointValueMultiplier: 1,
					activityReferenceNumber: '',
					completionPoints: this.campaign.completionPoints
				};
			});
		const foundAction = this.actions.find((action) => action.id === actionId);
		return {
			brand,
			brandLocation,
			campaigns: sortedCampaigns,
			createdOn: undefined,
			description: '',
			id: actionId,
			isActive: 1,
			modifiedOn: '',
			name: '',
			pointValue: foundAction?.pointValue || 0,
			type: foundAction?.type || ''
		};
	}

	update(actionId: number, updateObject: Api.Action.Req.Update): Promise<Api.Action.Res.Get> {
		return;
	}

	async delete(actionId: number, companyId: number): Promise<number> {
		return actionId;
	}

	getBrandAndLocationActions(companyId: number): Promise<BrandAndLocationAction[]> {
		return;
	}
}
