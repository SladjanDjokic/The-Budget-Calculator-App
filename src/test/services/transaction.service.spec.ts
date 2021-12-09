import chai from 'chai';
import TriggerServiceMock from '../../services/trigger/trigger.service.mock';
import SystemActionLogServiceMock from '../../services/systemActionLog/systemActionLog.service.mock';
import PaymentServiceMock from '../../services/payment/payment.service.mock';
import ActionServiceMock from '../../services/action/action.service.mock';
import TransactionService from '../../services/transaction/transaction.service';
import transactionResource from '../resources/transaction.service.resource';
import { BrandAndLocationAction } from '../../database/interfaces/IActionTable';

describe('TransactionService', function () {
	let transactionService: TransactionService;

	before(async function () {
		transactionService = new TransactionService();
		transactionService.start({
			TriggerService: new TriggerServiceMock(),
			SystemActionLogService: new SystemActionLogServiceMock(),
			PaymentService: new PaymentServiceMock(),
			ActionService: new ActionServiceMock(
				transactionResource.actions,
				transactionResource.campaignActions,
				transactionResource.campaign
			),
			CampaignService: transactionResource.campaignService
		});
	});

	describe('Transaction Helper Methods', function () {
		it('should get an action given a transaction message and available actions', function () {
			const action: BrandAndLocationAction = transactionService['getTransactionActionId'](
				transactionResource.authDetails,
				transactionResource.brandAndLocationActions
			);
			chai.expect(action.id).to.exist.and.to.be.a('number');
			chai.expect(action.brandDetails[0].externalId).to.equal(transactionResource.authDetails.brand.id);
		});
		it('should return null for a given transaction authorization and available actions', function () {
			let invalidCampaignActions: BrandAndLocationAction[] = [...transactionResource.brandAndLocationActions];
			invalidCampaignActions[0].brandDetails[0].externalId = '999';
			const action: BrandAndLocationAction = transactionService['getTransactionActionId'](
				transactionResource.authDetails,
				invalidCampaignActions
			);
			chai.expect(action).to.be.undefined;
		});
	});
});
