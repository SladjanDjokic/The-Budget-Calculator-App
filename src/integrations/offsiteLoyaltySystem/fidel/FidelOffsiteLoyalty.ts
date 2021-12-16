import OffsiteLoyalty, { OffsiteBrand, OffsiteBrandLocation, LoyaltyCard } from '../OffsiteLoyalty.class';
import { IFidel } from '../../fidel/IFidel';
import Fidel from '../../fidel/Fidel';
import { ObjectUtils } from '../../../utils/utils';
import { ISpreedly } from '../../spreedly/ISpreedly';
import IntegrationCompanyDetails = RedSky.IntegrationCompanyDetails;
import UserPaymentMethod from '../../../database/objects/userPaymentMethod.db';
import logger from '../../../utils/logger';
import { RsError } from '../../../utils/errors';
import VaultSystemProvider from '../../vaultSystem/vaultSystemProvider';

export default class FidelOffsiteLoyalty extends OffsiteLoyalty {
	readonly name = 'fidel';
	private connector: Fidel;
	private serviceDetails: IFidel.ServiceDetails;

	constructor(readonly userPaymentMethodTable: UserPaymentMethod) {
		super();
	}

	setConnectorAndDetails(companyDetails: RedSky.IntegrationCompanyDetails): void {
		this.serviceDetails = ObjectUtils.smartParse(companyDetails.serviceKey);
		this.connector = new Fidel(this.serviceDetails);
	}

	async register(
		companyDetails: RedSky.IntegrationCompanyDetails,
		createdClientPaymentMethod: Model.UserPaymentMethod,
		vaultSystemProvider: VaultSystemProvider
	): Promise<LoyaltyCard> {
		this.setConnectorAndDetails(companyDetails);
		const formatRequestDetails: ISpreedly.Delivery.Req = this.formatDeliverRequest(createdClientPaymentMethod);
		const { system, companyDetails: paymentCompanyDetails } = await vaultSystemProvider.get();
		const registeredOffsiteCardString: string = await system.registerOffsiteLoyalty(
			paymentCompanyDetails,
			{
				receiver: this.serviceDetails.receiver,
				...formatRequestDetails
			},
			createdClientPaymentMethod.id
		);
		const registeredOffsiteCard: IFidel.Res.Register = ObjectUtils.smartParse(registeredOffsiteCardString);
		return this.formatRegisterResponse(registeredOffsiteCard.items[0]);
	}

	async delete(
		companyDetails: IntegrationCompanyDetails,
		{
			id,
			userAddressId,
			token,
			cardNumber,
			isPrimary,
			createdOn,
			metaData,
			...userPaymentMethod
		}: Model.UserPaymentMethod
	): Promise<boolean> {
		this.setConnectorAndDetails(companyDetails);
		const cardToDelete: Model.UserPaymentMethod[] = await this.userPaymentMethodTable.getByProperties({
			...userPaymentMethod,
			systemProvider: this.name
		});
		for (let card of cardToDelete) {
			logger.info(card);
			const deleteResult = await this.connector.deleteCard(card);
			logger.info(deleteResult);
		}
		return null;
	}

	async getBrandList(companyDetails: IntegrationCompanyDetails): Promise<OffsiteBrand[]> {
		this.setConnectorAndDetails(companyDetails);
		const brandList: IFidel.Brands.Res.List = await this.connector.getBrandList();
		if (!brandList || brandList.status > 300) {
			logger.error('FIDEL - Failed to get brandList', brandList);
			throw new RsError('BAD_REQUEST', 'FIDEL - Failed to get brandList');
		}
		const offsiteBrandList: OffsiteBrand[] = [];
		for (let brand of brandList.items) {
			offsiteBrandList.push({
				externalId: brand.id,
				name: brand.name,
				metaData: JSON.stringify(brand)
			});
		}
		return offsiteBrandList;
	}

	async getBrandLocations(
		companyDetails: IntegrationCompanyDetails,
		externalBrandId: string
	): Promise<OffsiteBrandLocation[]> {
		this.setConnectorAndDetails(companyDetails);
		const locationList: IFidel.Location.Res.List = await this.connector.getLocationsForBrand(externalBrandId);
		if (!locationList || locationList.status > 300) {
			logger.error('FIDEL - Failed to get locationList', locationList);
			throw new RsError('BAD_REQUEST', 'FIDEL - Failed to get locationList');
		}
		return this.formatBrandLocations(locationList);
	}

	private formatDeliverRequest(createdClientPaymentMethod: Model.UserPaymentMethod): ISpreedly.Delivery.Req {
		return {
			delivery: {
				payment_method_token: createdClientPaymentMethod.token,
				url: `${this.serviceDetails.baseUrl}/programs/${this.serviceDetails.programId}/cards`,
				headers: `Content-Type: application/json\nfidel-key: ${this.serviceDetails.apiPublicKey}`,
				body:
					'{"number":"{{credit_card_number}}","expMonth":{{credit_card_month}},"expYear":{{credit_card_year}},"countryCode":"USA","termsOfUse":true}' // this needs to be a string so the injected values aren't stringified as well in Spreedly
			}
		};
	}

	private formatRegisterResponse(registeredOffsiteCard: IFidel.Model.RegisterItem): LoyaltyCard {
		return {
			token: registeredOffsiteCard.id,
			type: registeredOffsiteCard.type,
			last4: Number(registeredOffsiteCard.lastNumbers),
			expirationMonth: registeredOffsiteCard.expMonth,
			expirationYear: registeredOffsiteCard.expYear,
			cardNumber: `XXXX-XXXX-XXXX-${Number(registeredOffsiteCard.lastNumbers)}`,
			systemProvider: this.name,
			metaData: JSON.stringify(registeredOffsiteCard),
			isPrimary: 0 as 0 | 1
		};
	}

	private formatBrandLocations(locationList: IFidel.Location.Res.List): OffsiteBrandLocation[] {
		const finalList: OffsiteBrandLocation[] = [];
		for (let location of locationList.items) {
			finalList.push({
				address1: location.address,
				address2: null,
				city: location.city,
				state: location.stateCode,
				zip: location.postcode,
				country: this.getCountry(location.stateCode),
				isActive: location.active ? 1 : 0,
				loyaltyStatus: 'PENDING',
				externalId: location.id,
				metaData: JSON.stringify(location)
			});
		}
		return finalList;
	}

	// We can break this method out at a future point if we do international stuff
	private getCountry(country: string): string {
		if (country === 'USA') return 'US';
		return 'US'; // simply just for defaulting
	}
}
