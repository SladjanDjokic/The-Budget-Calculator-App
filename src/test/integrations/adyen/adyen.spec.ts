import chai from 'chai';
import adyenResource from '../../resources/adyen.integration.resource';
import AdyenPayment from '../../../integrations/paymentSystem/adyen/adyenPayment';
import { ObjectUtils } from '../../../utils/utils';

// We aren't integrating directly into Adyen any longer. We access Adyen THROUGH Spreedly api
describe('Adyen Tests', function () {
	let adyenPaymentSystem: AdyenPayment = new AdyenPayment();

	describe('Payment Methods', function () {
		it('should get available payment methods', async function () {
			const paymentMethods: ICheckout.PaymentMethodsResponse = await adyenPaymentSystem.getAvailablePaymentMethods(
				adyenResource.companyDetails,
				adyenResource.paymentMethods
			);
			chai.expect(paymentMethods).to.exist;
			chai.expect(paymentMethods.paymentMethods).to.be.an('array');
			chai.expect(paymentMethods.paymentMethods[0]).to.haveOwnProperty('name');
			chai.expect(paymentMethods.paymentMethods[0]).to.haveOwnProperty('type');
			chai.expect(paymentMethods.paymentMethods[0]).to.haveOwnProperty('brands');
			for (let details of paymentMethods.paymentMethods[0].details) {
				if (!ObjectUtils.isArrayWithData(details)) continue;
				chai.expect(details).to.haveOwnProperty('key');
				chai.expect(details).to.haveOwnProperty('type');
				chai.expect(adyenResource.paymentMethodDetailTypes).to.include(details.type);
			}
		});
	});
});
