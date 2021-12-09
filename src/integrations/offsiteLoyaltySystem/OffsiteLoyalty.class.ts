import IntegrationCompanyDetails = RedSky.IntegrationCompanyDetails;
import { RsError } from '../../utils/errors';
import VaultSystemProvider from '../vaultSystem/vaultSystemProvider';

export interface LoyaltyCard {
	token: string;
	type: string;
	last4: number;
	expirationMonth: number;
	expirationYear: number;
	cardNumber: string;
	systemProvider: string;
	metaData: any;
	isPrimary?: 0 | 1;
}

export interface OffsiteBrand {
	externalId: string | number;
	name: string;
	metaData: string; // third party object stringified
}

export interface OffsiteBrandLocation extends Omit<Model.BrandLocation, 'id' | 'brandId' | 'name'> {}

export default abstract class OffsiteLoyalty {
	readonly name: string;
	constructor() {}

	getSystemName(): string {
		return this.name;
	}

	register(
		companyDetails: IntegrationCompanyDetails,
		createdClientPaymentMethod: Model.UserPaymentMethod,
		vaultSystemProvider: VaultSystemProvider
	): Promise<LoyaltyCard> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}

	delete(companyDetails: IntegrationCompanyDetails, userPaymentMethod: Model.UserPaymentMethod): Promise<boolean> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}

	getBrandList(companyDetails: IntegrationCompanyDetails): Promise<OffsiteBrand[]> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}

	getBrandLocations(
		companyDetails: IntegrationCompanyDetails,
		externalBrandId: string
	): Promise<OffsiteBrandLocation[]> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}
}
