import Payment, { CreatePayment } from '../Payment.class';
import { ObjectUtils } from '../../../utils/utils';
import { IAdyen } from '../../adyen/Adyen.interface';
import IntegrationCompanyDetails = RedSky.IntegrationCompanyDetails;
import Adyen from '../../adyen/Adyen';
import { RsError } from '../../../utils/errors';
import logger from '../../../utils/logger';
import adyenStatics from '../../adyen/adyenStatics';

export default class AdyenPayment extends Payment {
	readonly name = 'adyen';
	constructor() {
		super();
	}

	private getConnectorAndDetails(companyDetails: IntegrationCompanyDetails) {
		let serviceDetails: IAdyen.ServiceDetails = ObjectUtils.smartParse(companyDetails.serviceKey);
		let connector = new Adyen(serviceDetails);
		return { connector, serviceDetails };
	}

	async getAvailablePaymentMethods(
		companyDetails: IntegrationCompanyDetails,
		paymentMethods: IAdyen.Payment.Req.PaymentMethod
	): Promise<ICheckout.PaymentMethodsResponse> {
		const { connector } = await this.getConnectorAndDetails(companyDetails);
		return await connector.getPaymentMethods(paymentMethods);
	}

	async createPayment(
		companyDetails: IntegrationCompanyDetails,
		paymentData: CreatePayment
	): Promise<IAdyen.Payment.Res.CreatePayment> {
		const { connector } = await this.getConnectorAndDetails(companyDetails);
		const paymentResponse:
			| IAdyen.Payment.Res.CreatePayment
			| IAdyen.Payment.Res.CreatePaymentFailure = await connector.createPayment(paymentData);
		if ('refusalReason' in paymentResponse) {
			const failureMessage = adyenStatics.adyenRefusalStatus[parseInt(paymentResponse?.refusalReasonCode)];
			logger.error(`${'INVALID_PAYMENT'} ${failureMessage}`, paymentResponse);
			throw new RsError('INVALID_PAYMENT', failureMessage);
		}
		return paymentResponse as IAdyen.Payment.Res.CreatePayment;
	}
}
