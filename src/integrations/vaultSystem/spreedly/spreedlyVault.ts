import Vault, { AddPayment, VaultDetails } from '../VaultSystem.class';
import { ISpreedly } from '../../spreedly/ISpreedly';
import Spreedly from '../../spreedly/Spreedly';
import { ObjectUtils } from '../../../utils/utils';
import { RsError } from '../../../utils/errors';
import logger from '../../../utils/logger';
import ReservationSystemProvider from '../../../integrations/reservationSystem/reservationSystemProvider';
import IUserPaymentMethodTable from '../../../database/interfaces/IUserPaymentMethodTable';
import IUserAddressTable from '../../../database/interfaces/IUserAddressTable';
import { ServiceKeyAndDetails } from '../../../database/interfaces/IServiceKeyTable';
import ICompanyTable from '../../../database/interfaces/ICompanyTable';

export default class SpreedlyVault extends Vault {
	private serviceDetails: ISpreedly.ServiceDetails;
	private connector: Spreedly;
	readonly name = 'spreedly';

	constructor(
		private readonly userAddressTable: IUserAddressTable,
		private readonly companyTable: ICompanyTable,
		private readonly userPaymentMethodTable: IUserPaymentMethodTable,
		private readonly reservationSystemProvider: ReservationSystemProvider
	) {
		super();
	}

	async setConnectorAndDetails(companyDetails: RedSky.IntegrationCompanyDetails): Promise<void> {
		this.serviceDetails = ObjectUtils.smartParse(companyDetails.serviceKey);
		const gatewayToken: Model.CompanyGateway = await this.getActiveGateway();
		this.connector = new Spreedly(this.serviceDetails, gatewayToken);
	}

	async vaultToken(
		companyDetails: RedSky.IntegrationCompanyDetails,
		paymentMethodDetails: AddPayment
	): Promise<VaultDetails> {
		await this.setConnectorAndDetails(companyDetails);
		const formattedForStore: ISpreedly.Store.Req = await this.convertToStoreFormat(
			paymentMethodDetails,
			companyDetails.id
		);
		const vaultedToken: ISpreedly.Store.Res = await this.connector.store(formattedForStore);
		return this.formatVaultedResponse(vaultedToken);
	}

	async registerOffsiteLoyalty(
		companyDetails: RedSky.IntegrationCompanyDetails,
		{ receiver, ...offsiteLoyaltyDetails }: any,
		paymentMethodId: number
	): Promise<string> {
		await this.setConnectorAndDetails(companyDetails);
		const registerResponse: ISpreedly.Delivery.Res = await this.connector.deliverRequestToReceiver(
			receiver,
			offsiteLoyaltyDetails
		);
		if (!registerResponse.transaction.succeeded) {
			logger.error(JSON.stringify(registerResponse.transaction), registerResponse.transaction);
			throw new RsError('BAD_REQUEST', 'Failed to register offsite loyalty');
		}
		await this.retainVaultedPaymentMethod(companyDetails, paymentMethodId);
		return registerResponse.transaction.response.body;
	}

	async appendPaymentMethod(
		vaultCompanyDetails: ServiceKeyAndDetails,
		spireReservation: Model.Reservation,
		paymentMethodId: number
	) {
		await this.setConnectorAndDetails(vaultCompanyDetails);
		const paymentMethodById: Model.UserPaymentMethod = await this.userPaymentMethodTable.getById(
			paymentMethodId,
			vaultCompanyDetails.id
		);
		const paymentMethod: Model.UserPaymentMethod = await this.getPaymentMethodForThisSystem(
			paymentMethodById,
			this.userPaymentMethodTable
		);
		const {
			system: reservationSystem,
			companyDetails: reservationCompanyDetails
		} = (await this.reservationSystemProvider.get(vaultCompanyDetails.id)) as {
			system: ISpreedly.IntegratedReservationSystem;
			companyDetails: RedSky.IntegrationCompanyDetails;
		};
		const receiver = reservationSystem.getReceiver(reservationCompanyDetails);
		const [requestTemplate, url, headers] = await reservationSystem.formatAppendPaymentMethodRequest(
			reservationCompanyDetails,
			spireReservation,
			paymentMethod
		);
		const deliveryRequest = this.formatDeliveryRequest(paymentMethod.token, url, headers, requestTemplate, 'PATCH');
		const deliverResponse: ISpreedly.Delivery.Res = await this.connector.deliverRequestToReceiver(
			receiver,
			deliveryRequest
		);
		if (!deliverResponse.transaction.succeeded || !deliverResponse.transaction.response?.body) {
			logger.error(JSON.stringify(deliverResponse.transaction), deliverResponse.transaction);
			throw new RsError('BAD_REQUEST', 'Failed to append a payment method to the reservation');
		}
		await this.retainVaultedPaymentMethod(vaultCompanyDetails, paymentMethodId);
		return deliverResponse.transaction.response.body;
	}

	async isPaymentMethodValid(
		paymentCompanyDetails: RedSky.IntegrationCompanyDetails,
		paymentMethod: Model.UserPaymentMethod
	): Promise<boolean> {
		await this.setConnectorAndDetails(paymentCompanyDetails);
		const vaultedPaymentMethod = await this.connector.show(paymentMethod.token);
		await this.userPaymentMethodTable.update(paymentMethod.id, {
			id: paymentMethod.id,
			metaData: JSON.stringify(vaultedPaymentMethod),
			isPrimary: paymentMethod.isPrimary
		});
		return vaultedPaymentMethod.payment_method.storage_state !== 'redacted';
	}

	private formatDeliveryRequest(
		token: string,
		receiverUrl: string,
		headers: string[],
		receiverRequestTemplate: ISpreedly.ReceiverRequestTemplate,
		requestMethod: ISpreedly.Delivery.RequestMethodTypes = 'POST'
	): ISpreedly.Delivery.Req {
		headers.push('Content-Type: application/json');
		return {
			delivery: {
				payment_method_token: token,
				url: receiverUrl,
				headers: headers.join('\n'),
				request_method: requestMethod,
				body: receiverRequestTemplate as string // this needs to be a string so the injected values aren't stringified as well in Spreedly
			}
		};
	}

	formatClientCard(
		companyDetails: RedSky.IntegrationCompanyDetails,
		{ cardToken, pmData, ...paymentMethodDetails }: AddPayment
	): VaultDetails {
		return {
			token: cardToken,
			nameOnCard: pmData.full_name,
			type: pmData.card_type,
			last4: pmData.last_four_digits,
			expirationMonth: pmData.month,
			expirationYear: pmData.year,
			cardNumber: pmData.number,
			systemProvider: 'spreedly',
			isPrimary: paymentMethodDetails.isPrimary,
			metaData: JSON.stringify({ cardToken, ...pmData, ...paymentMethodDetails })
		};
	}

	private async getActiveGateway(): Promise<Model.CompanyGateway> {
		const paymentGateways: Model.CompanyGateway[] = await this.companyTable.getGateways();
		const activePrimaryGateway: Model.CompanyGateway = paymentGateways.find(
			(gateway) => gateway.isPrimary && gateway.isActive
		);
		return activePrimaryGateway;
	}

	private async convertToStoreFormat(
		paymentMethodDetails: AddPayment,
		companyId: number
	): Promise<ISpreedly.Store.Req> {
		let storeDetails: ISpreedly.Store.Req = {
			transaction: {
				recurring_processing_model: 'CardOnFile',
				payment_method_token: paymentMethodDetails.cardToken,
				currency_code: 'USD',
				gateway_specific_fields: {
					adyen: {
						shopper_reference: paymentMethodDetails.userId,
						recurring_processing_model: 'CardOnFile',
						shopper_statement: 'Spire Hospitality'
					}
				}
			}
		};
		if (!paymentMethodDetails.userAddressId) return storeDetails;
		const userAddress: Model.UserAddress = await this.userAddressTable.getById(
			paymentMethodDetails.userAddressId,
			companyId
		);
		storeDetails.transaction.gateway_specific_fields.adyen = {
			...storeDetails.transaction.gateway_specific_fields.adyen,
			address1: userAddress.address1,
			address2: userAddress.address2,
			city: userAddress.city,
			state: userAddress.state,
			zip: userAddress.zip,
			country: userAddress.country
		};
		return storeDetails;
	}

	private formatVaultedResponse(vaultedToken: ISpreedly.Store.Res): VaultDetails {
		// We will have to confirm on this if its the correct token to store out or if we want something else
		return {
			token: vaultedToken.transaction.payment_method.third_party_token,
			nameOnCard: vaultedToken.transaction.basis_payment_method.full_name,
			type: vaultedToken.transaction.basis_payment_method.card_type,
			last4: vaultedToken.transaction.basis_payment_method.last_four_digits,
			expirationMonth: vaultedToken.transaction.basis_payment_method.month,
			expirationYear: vaultedToken.transaction.basis_payment_method.year,
			cardNumber: vaultedToken.transaction.basis_payment_method.number,
			systemProvider: vaultedToken.transaction.gateway_type,
			metaData: JSON.stringify(vaultedToken)
		};
	}

	/**
	 * retainVaultedPaymentMethod - calls out to Spreedly to retain the vaulted payment method and then updates the locally stored payment method token
	 * @param companyDetails
	 * @param paymentMethodId
	 * @private
	 * @throws - Can throw an error if we fail to retain the payment method token (its important that we know this happened, it means the payment token is now invalid)
	 */
	private async retainVaultedPaymentMethod(
		companyDetails: RedSky.IntegrationCompanyDetails,
		paymentMethodId: number
	): Promise<void> {
		await this.setConnectorAndDetails(companyDetails);
		const userPaymentMethod: Model.UserPaymentMethod = await this.userPaymentMethodTable.getById(
			paymentMethodId,
			companyDetails.id
		);
		const paymentMethod: Model.UserPaymentMethod = await this.getPaymentMethodForThisSystem(
			userPaymentMethod,
			this.userPaymentMethodTable
		);
		try {
			const retainedPaymentToken: ISpreedly.Retain.Res.Retain = await this.connector.retain(paymentMethod.token);
			if (!retainedPaymentToken || !retainedPaymentToken.transaction.succeeded)
				throw new RsError('INVALID_PAYMENT', 'Spreedly - Failed to retain token');
			const formattedRetainedToken = this.formatRetainTokenToSave(retainedPaymentToken, paymentMethod);
			await this.userPaymentMethodTable['updateInternal'](
				paymentMethod.id,
				formattedRetainedToken,
				companyDetails.id
			);
		} catch (e) {
			logger.error(`Something went wrong while attempting to retain payment token - ${JSON.stringify(e)}`, e);
			throw e;
		}
	}

	private formatRetainTokenToSave(
		retainedPaymentToken: ISpreedly.Retain.Res.Retain,
		currentPaymentMethod: Model.UserPaymentMethod
	) {
		const paymentMetaData = ObjectUtils.smartParse(currentPaymentMethod.metaData);
		const retainedPaymentMethod = retainedPaymentToken.transaction.payment_method;
		return {
			token: retainedPaymentToken.transaction.payment_method.token,
			metaData: JSON.stringify({
				...paymentMetaData,
				...retainedPaymentMethod,
				cardToken: retainedPaymentToken.transaction.payment_method.token
			})
		};
	}
}
