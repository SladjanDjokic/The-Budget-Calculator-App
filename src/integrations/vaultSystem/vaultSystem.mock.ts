import { ServiceKeyAndDetails } from '../../database/interfaces/IServiceKeyTable';
import logger from '../../utils/logger';
import Vault, { VaultDetails } from './VaultSystem.class';

export default class VaultSystemMock extends Vault {
	readonly name: string = 'mock';
	getAvailablePaymentMethods(companyDetails: RedSky.IntegrationCompanyDetails, paymentMethods: any): Promise<any> {
		throw new Error('Method not implemented.');
	}
	vaultToken(companyDetails: RedSky.IntegrationCompanyDetails, paymentMethodDetails: any): Promise<VaultDetails> {
		throw new Error('Method not implemented.');
	}
	registerOffsiteLoyalty(
		companyDetails: RedSky.IntegrationCompanyDetails,
		offsiteLoyaltyDetails: any
	): Promise<string> {
		throw new Error('Method not implemented.');
	}

	formatClientCard(companyDetails: RedSky.IntegrationCompanyDetails, paymentMethodDetails: any): VaultDetails {
		throw new Error('Method not implemented.');
	}
	getSystemName(): string {
		throw new Error('Method not implemented.');
	}

	appendPaymentMethod(
		paymentCompanyDetails: ServiceKeyAndDetails,
		spireReservation: Model.Reservation,
		paymentMethodId: number
	) {
		logger.info('Appending payment method');
	}
}
