import { IAdyen } from './Adyen.interface';
import { CheckoutAPI, Client } from '@adyen/api-library/';
import logger from '../../utils/logger';

interface PaymentMethod extends IAdyen.Payment.Req.PaymentMethod {
	merchantAccount: string;
	channel: 'Web';
}

export default class Adyen {
	adyenClient: Client;
	adyenCheckout: CheckoutAPI;
	serviceDetails: IAdyen.ServiceDetails;
	constructor(serviceDetails: IAdyen.ServiceDetails) {
		this.adyenClient = new Client({ apiKey: serviceDetails.apiKey, environment: serviceDetails.environment });
		this.adyenCheckout = new CheckoutAPI(this.adyenClient);
		this.serviceDetails = serviceDetails;
	}

	async getPaymentMethods(
		paymentMethodObj: IAdyen.Payment.Req.PaymentMethod
	): Promise<ICheckout.PaymentMethodsResponse> {
		const paymentConfig: PaymentMethod = {
			...paymentMethodObj,
			channel: 'Web',
			merchantAccount: this.serviceDetails.merchantAccount
		};
		return await this.adyenCheckout.paymentMethods(paymentConfig);
	}

	async createPayment({
		referenceId,
		userId,
		...paymentData
	}): Promise<IAdyen.Payment.Res.CreatePayment | IAdyen.Payment.Res.CreatePaymentFailure> {
		const paymentConfig: IAdyen.Payment.Req.CreatePayment = {
			...(paymentData as Omit<Api.Order.Req.CreatePayment, 'referenceId'>),
			merchantAccount: this.serviceDetails.merchantAccount,
			returnUrl: this.serviceDetails.paymentReturnUrl,
			reference: referenceId.toString(),
			storePaymentMethod: paymentData.storePaymentMethod ? paymentData.storePaymentMethod : false,
			shopperReference: userId
		};
		try {
			return await this.adyenCheckout.payments(paymentConfig);
		} catch (e) {
			logger.error(JSON.stringify(e));
			throw e;
		}
	}
}
