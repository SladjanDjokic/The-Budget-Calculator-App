import IntegrationCompanyDetails = RedSky.IntegrationCompanyDetails;
import { RsError } from '../../utils/errors';
import IUserPaymentMethodTable, { Properties } from '../../database/interfaces/IUserPaymentMethodTable';
import { ServiceKeyAndDetails } from '../../database/interfaces/IServiceKeyTable';

export interface CreatePayment extends Api.Order.Req.CreatePayment {
	userId: number;
}

export interface AddPayment extends Api.Payment.Req.Create {
	userId: number;
}

export interface VaultDetails {
	token: string;
	nameOnCard: string;
	type: string;
	last4: number;
	expirationMonth: number;
	expirationYear: number;
	cardNumber: string;
	systemProvider: string;
	metaData: any;
	isPrimary?: 0 | 1;
}

export default abstract class Payment {
	readonly name: string;
	constructor() {}

	async getAvailablePaymentMethods(companyDetails: IntegrationCompanyDetails, paymentMethods: any): Promise<any> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}

	async vaultToken(companyDetails: IntegrationCompanyDetails, paymentMethodDetails: any): Promise<VaultDetails> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}

	async registerOffsiteLoyalty(
		companyDetails: RedSky.IntegrationCompanyDetails,
		offsiteLoyaltyDetails: any,
		paymentMethodId
	): Promise<string> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}

	async chargeDeposit(
		paymentCompanyDetails: IntegrationCompanyDetails,
		reservationId: number,
		paymentMethod: Model.UserPaymentMethod,
		amount: number
	): Promise<string> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}

	formatClientCard(companyDetails: IntegrationCompanyDetails, paymentMethodDetails: any): VaultDetails {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}

	getSystemName(): string {
		return this.name;
	}

	appendPaymentMethod(
		paymentCompanyDetails: ServiceKeyAndDetails,
		spireReservation: Model.Reservation,
		paymentMethodId: number
	) {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}

	/**
	 * getPaymentMethodForThisSystem - gets the correct payment method for a given system
	 * @param {Model.UserPaymentMethod} paymentMethod
	 * @param table
	 * @throws - This method can throw an error if its not able to find a matching payment method and system
	 */
	async getPaymentMethodForThisSystem(
		paymentMethod: Model.UserPaymentMethod,
		table: IUserPaymentMethodTable
	): Promise<Model.UserPaymentMethod> {
		if (paymentMethod.systemProvider === this.name) return paymentMethod;
		const cardByPropertiesRequest: Properties = {
			userId: paymentMethod.userId,
			nameOnCard: paymentMethod.nameOnCard,
			type: paymentMethod.type,
			last4: paymentMethod.last4,
			expirationMonth: paymentMethod.expirationMonth,
			expirationYear: paymentMethod.expirationYear,
			systemProvider: this.name
		};
		const paymentMatches: Model.UserPaymentMethod[] = await table.getByProperties(cardByPropertiesRequest);
		if (!!!paymentMatches?.length) {
			throw new RsError('DECLINED_PAYMENT', 'No matching payment method for this payment provider');
		}
		return paymentMatches[0];
	}
}
