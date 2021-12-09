import { Service } from '../Service';
import { IFidel } from '../../integrations/fidel/IFidel';
import { BrandAndLocationAction } from '../../database/interfaces/IActionTable';
import logger from '../../utils/logger';
import ITriggerService from '../trigger/ITriggerService';
import IActionService from '../action/IActionService';
import ICampaignService from '../campaign/ICampaignService';
import IPaymentService from '../payment/IPaymentService';
import ISystemActionLogService from '../systemActionLog/ISystemActionLogService';
import TriggerService from '../trigger/trigger.service';
import { ServiceName } from '../serviceFactory';
import PaymentService from '../payment/payment.service';
import ActionService from '../action/action.service';
import CampaignService from '../campaign/campaign.service';
import SystemActionLogService from '../systemActionLog/systemActionLog.service';

export default class TransactionService extends Service {
	triggerService: ITriggerService;
	paymentService: IPaymentService;
	actionService: IActionService;
	campaignService: ICampaignService;
	systemActionLogService: ISystemActionLogService;
	constructor() {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.triggerService = services['TriggerService'] as TriggerService;
		this.paymentService = services['PaymentService'] as PaymentService;
		this.actionService = services['ActionService'] as ActionService;
		this.campaignService = services['CampaignService'] as CampaignService;
		this.systemActionLogService = services['SystemActionLogService'] as SystemActionLogService;
	}

	async offsiteAuth(authDetails: IFidel.Transaction.Req.Auth, companyId?: number): Promise<void> {
		const paymentMethod: Model.UserPaymentMethod = await this.getPaymentMethod(authDetails);
		if (!paymentMethod) return;
		const action: BrandAndLocationAction = await this.getAction(authDetails, paymentMethod.userId, companyId);
		if (!action) return;
		try {
			await this.triggerService.fireActionForUser(paymentMethod.userId, action.id, companyId);
		} catch (e) {
			if (e.err === 'NOT_FOUND') {
				logger.warn(`ACTION ${action.id} NOT ADDED TO CAMPAIGN, NO POINTS AWARDED`, action);
			}
			throw e;
		}
	}

	async offsiteRefund(authDetails: IFidel.Transaction.Req.Refund, companyId?: number): Promise<void> {
		const paymentMethod: Model.UserPaymentMethod = await this.getPaymentMethod(authDetails);
		if (!paymentMethod) return;
		const action: BrandAndLocationAction = await this.getAction(authDetails, paymentMethod.userId, companyId);
		if (!action) return;
		const campaignActions: Model.CampaignAction[] = await this.campaignService.getCampaignActionsByActionId(
			action.id,
			companyId
		);
		for (let campaignAction of campaignActions) {
			await this.triggerService.refundActionForUser(paymentMethod.userId, campaignAction, companyId);
		}
	}

	private async getPaymentMethod(authDetails: IFidel.Transaction.Req.Refund): Promise<Model.UserPaymentMethod> {
		const paymentMethod: Model.UserPaymentMethod = await this.paymentService.getPaymentMethodByToken(
			authDetails.card.id
		);
		if (!paymentMethod) {
			logger.info('NO PAYMENT METHOD FOUND FOR TRANSACTION.AUTH');
			this.systemActionLogService.formatLogItem({
				userId: null,
				originalUrl: 'transaction.service',
				action: 'TRIGGER',
				source: 'action',
				...authDetails
			});
		}
		return paymentMethod;
	}

	private async getAction(
		authDetails: IFidel.Transaction.Req.Auth,
		userId: number,
		companyId: number = 0
	): Promise<BrandAndLocationAction> {
		const companyActions: BrandAndLocationAction[] = await this.actionService.getBrandAndLocationActions(companyId);
		const action: BrandAndLocationAction = this.getTransactionActionId(authDetails, companyActions);
		if (!action) {
			logger.info('NO ACTIONID FOUND FOR TRANSACTION.AUTH');
			this.systemActionLogService.formatLogItem({
				userId: userId,
				originalUrl: 'transaction.service',
				action: 'TRIGGER',
				source: 'action',
				...authDetails
			});
			return;
		}
		return action;
	}

	private getTransactionActionId(
		authDetails: IFidel.Transaction.Req.Auth,
		companyActions: BrandAndLocationAction[]
	): BrandAndLocationAction {
		const brandId: string = authDetails.brand.id;
		const locationId: string = authDetails.location.id;
		for (let action of companyActions) {
			for (let brand of action.brandDetails) {
				if (brand.externalId !== brandId) continue;
				for (let location of brand.locations) {
					if (location.externalId !== locationId) continue;
					return action;
				}
				return action;
			}
		}
		return;
	}
}
