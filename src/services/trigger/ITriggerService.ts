import IService from '../IService';

export interface GroupedUserActions {
	[key: number]: number;
}
export default interface ITriggerService extends IService {
	fireActionForUser: (userId: number, actionId: number, companyId: number) => Promise<boolean>;
	refundActionForUser: (userId: number, campaignAction: Model.CampaignAction, companyId: number) => Promise<boolean>;
}
