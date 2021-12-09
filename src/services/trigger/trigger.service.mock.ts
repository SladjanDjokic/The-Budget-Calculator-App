import ITriggerService from './ITriggerService';

export default class TriggerServiceMock implements ITriggerService {
	constructor() {}
	start() {}

	async fireActionForUser(userId: number, actionId: number, companyId: number): Promise<boolean> {
		return true;
	}

	async refundActionForUser(
		userId: number,
		campaignAction: Model.CampaignAction,
		companyId: number
	): Promise<boolean> {
		return true;
	}
}
