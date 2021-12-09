import { Service } from '../Service';
import { AddPayment } from '../../integrations/paymentSystem/Payment.class';
import IPaymentService from './IPaymentService';

export default class PaymentServiceMock extends Service implements IPaymentService {
	start() {}

	async getAvailablePaymentMethods(
		paymentMethods: Api.Order.Req.PaymentMethods,
		companyId: number
	): Promise<Api.Order.Res.PaymentMethods> {
		return;
	}

	async addPayment(paymentTokenDetails: AddPayment, companyId: number): Promise<Api.Payment.Res.Create> {
		return {
			cardNumber: '',
			createdOn: undefined,
			expirationMonth: 0,
			expirationYear: 0,
			id: 1,
			isPrimary: undefined,
			last4: 0,
			metaData: undefined,
			nameOnCard: '',
			systemProvider: undefined,
			token: '',
			type: '',
			userAddressId: 0,
			userId: 0
		};
	}

	getClientGatewayPublic(): Promise<Api.Payment.Res.PublicData> {
		return;
	}

	getActiveByUserId(userId: number): Promise<Model.UserPaymentMethod> {
		return;
	}

	async delete(userPaymentMethodId: number): Promise<number> {
		return userPaymentMethodId;
	}

	update(paymentUpdate: Api.Payment.Req.Update): Promise<Model.UserPaymentMethod> {
		return;
	}

	async createOffsiteLoyaltyEnrollment(
		createdClientPaymentMethod: Model.UserPaymentMethod,
		companyId: number
	): Promise<Model.UserPaymentMethod[]> {
		return;
	}

	getPaymentMethodByToken(paymentToken: string): Promise<Model.UserPaymentMethod> {
		return;
	}
}
