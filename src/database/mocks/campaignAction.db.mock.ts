import { DateUtils } from '../../utils/utils';
import ICampaignActionTable, { CampaignActionCreate } from '../interfaces/ICampaignActionTable';
import TableMock from './table.db.mock';

export default class CampaignActionTableMock extends TableMock implements ICampaignActionTable {
	campaignActions: { [key: number]: Model.CampaignAction } = {};
	createCount = 0;
	constructor(campaignActions: Model.CampaignAction[] = []) {
		super();

		campaignActions.forEach((action) => {
			this.campaignActions[action.id] = action;
		});
	}
	columns: ['id', 'companyId', 'campaignId', 'actionId', 'createdOn', 'actionCount'];
	async create({ actionCount, ...objToCreate }: CampaignActionCreate): Promise<Model.CampaignAction> {
		this.createCount++;
		const createId = Date.now();
		this.campaignActions[createId] = {
			...objToCreate,
			id: createId,
			actionCount,
			createdOn: DateUtils.dbNow(),
			isActive: 1,
			pointValue: 500
		};
		return this.campaignActions[createId];
	}

	async createManyActionsForCampaign(
		campaignId: number,
		actionList: Api.CampaignAction.CreateMany[]
	): Promise<Model.CampaignAction[]> {
		this.createCount++;
		let createId = Date.now();
		const returnCampaignActions = [];
		for (let action of actionList) {
			this.campaignActions[createId] = {
				id: createId,
				campaignId,
				actionId: action.actionId,
				createdOn: DateUtils.dbNow(),
				actionCount: action.actionCount || 1,
				isActive: 1,
				pointValue: 500
			};
			returnCampaignActions.push(this.campaignActions[createId]);
			createId += 1;
		}
		return returnCampaignActions;
	}

	async getByCampaignId(campaignId: number): Promise<Model.CampaignAction[]> {
		const response = [];
		for (let i in this.campaignActions) {
			if (this.campaignActions[i].campaignId !== campaignId) continue;
			response.push(this.campaignActions[i]);
		}
		return response;
	}

	async getByActionId(actionId: number): Promise<Model.CampaignAction[]> {
		const response = [];
		for (let index in this.campaignActions) {
			if (this.campaignActions[index].actionId !== actionId) continue;
			response.push(this.campaignActions[index]);
		}
		return response;
	}

	async getActiveByIds(ids: number[]): Promise<Model.CampaignAction[]> {
		return Object.values(this.campaignActions).filter((campaign) => ids.includes(campaign.actionId));
	}

	update: null;
	getById: null;
	getManyByIds: null;
	getByPage: null;
	delete: null;
	deleteMany: null;
	updateMany: null;
}
