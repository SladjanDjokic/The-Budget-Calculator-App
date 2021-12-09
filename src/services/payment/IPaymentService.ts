import IService from '../IService';
import { AddPayment } from '../../integrations/paymentSystem/Payment.class';

export default interface IPaymentService extends IService {
	getAvailablePaymentMethods: (
		paymentMethods: Api.Order.Req.PaymentMethods,
		companyId?: number
	) => Promise<Api.Order.Res.PaymentMethods>;

	addPayment: (paymentTokenDetails: AddPayment, companyId?: number) => Promise<Api.Payment.Res.Create>;

	getClientGatewayPublic: () => Promise<Api.Payment.Res.PublicData>;

	getActiveByUserId: (userId: number) => Promise<Model.UserPaymentMethod>;

	delete: (userPaymentMethodId: number) => Promise<number>;

	update: (paymentUpdate: Api.Payment.Req.Update) => Promise<Model.UserPaymentMethod>;

	createOffsiteLoyaltyEnrollment: (
		createdClientPaymentMethod: Model.UserPaymentMethod,
		companyId?: number
	) => Promise<Model.UserPaymentMethod[]>;

	getPaymentMethodByToken: (paymentToken: string) => Promise<Model.UserPaymentMethod>;
}
