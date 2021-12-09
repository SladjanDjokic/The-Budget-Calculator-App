import chai, { expect } from 'chai';
import dbSingleton from '../../../database/dbSingleton';
import FidelOffsiteLoyalty from '../../../integrations/offsiteLoyaltySystem/fidel/FidelOffsiteLoyalty';
import fidelResource from '../../resources/fidel.integration.resource';
import { ObjectUtils } from '../../../utils/utils';
import { IFidel } from '../../../integrations/fidel/IFidel';
import { LoyaltyCard, OffsiteBrand } from '../../../integrations/offsiteLoyaltySystem/OffsiteLoyalty.class';
import ReservationSystemProvider from '../../../integrations/reservationSystem/reservationSystemProvider';
import SpreedlyVault from '../../../integrations/vaultSystem/spreedly/spreedlyVault';
import VaultSystemProvider from '../../../integrations/vaultSystem/vaultSystemProvider';

describe('Fidel Integration Tests', function () {
	let offsiteLoyalty: FidelOffsiteLoyalty;
	let vaultSystemProvider: VaultSystemProvider;

	before(async function () {
		offsiteLoyalty = new FidelOffsiteLoyalty(dbSingleton.get().userPaymentMethod);
		const reservationSystemProvider = new ReservationSystemProvider(dbSingleton.get().serviceKey, {});
		vaultSystemProvider = new VaultSystemProvider(dbSingleton.get().serviceKey, {
			spreedly: new SpreedlyVault(
				dbSingleton.get().userAddress,
				dbSingleton.get().company,
				dbSingleton.get().userPaymentMethod,
				reservationSystemProvider
			),
			mock: null
		});
	});

	describe('Register a card in Fidel', function () {
		it('should format the deliver request', async function () {
			offsiteLoyalty.setConnectorAndDetails(fidelResource.companyDetails);
			const formattedRequest = offsiteLoyalty['formatDeliverRequest'](fidelResource.paymentMethod);
			const serviceDetails: IFidel.ServiceDetails = ObjectUtils.smartParse(
				fidelResource.companyDetails.serviceKey
			);
			expect(formattedRequest).to.exist;
			expect(formattedRequest).to.haveOwnProperty('delivery');
			expect(formattedRequest.delivery).to.haveOwnProperty('payment_method_token');
			expect(formattedRequest.delivery).to.haveOwnProperty('url');
			expect(formattedRequest.delivery).to.haveOwnProperty('headers');
			expect(formattedRequest.delivery).to.haveOwnProperty('body');
			expect(formattedRequest.delivery.payment_method_token).to.equal(fidelResource.paymentMethod.token);
			expect(formattedRequest.delivery.url).to.include(serviceDetails.baseUrl);
		});

		/**
		 *	We only want to run this if we need a sanity check on the integration. It requires getting a Spreedly token
		 *	from the iframe, updating the fidelResource.paymentMethod.token, last4, expiration month/year
		 */
		it.skip('should register a card in the fidel system', async function () {
			const formattedRegisteredCard: LoyaltyCard = await offsiteLoyalty.register(
				fidelResource.companyDetails,
				fidelResource.paymentMethod,
				vaultSystemProvider
			);
			expect(formattedRegisteredCard).to.exist;
			expect(formattedRegisteredCard).to.haveOwnProperty('token');
			expect(formattedRegisteredCard).to.haveOwnProperty('type');
			expect(formattedRegisteredCard).to.haveOwnProperty('last4');
			expect(formattedRegisteredCard).to.haveOwnProperty('expirationMonth');
			expect(formattedRegisteredCard).to.haveOwnProperty('expirationYear');
			expect(formattedRegisteredCard).to.haveOwnProperty('cardNumber');
			expect(formattedRegisteredCard).to.haveOwnProperty('systemProvider');
			expect(formattedRegisteredCard).to.haveOwnProperty('metaData');
			expect(formattedRegisteredCard).to.haveOwnProperty('isPrimary');
			expect(formattedRegisteredCard.type).to.equal(fidelResource.paymentMethod.type);
			expect(formattedRegisteredCard.last4).to.equal(fidelResource.paymentMethod.last4);
			expect(formattedRegisteredCard.expirationYear).to.equal(fidelResource.paymentMethod.expirationYear);
			expect(formattedRegisteredCard.expirationMonth).to.equal(fidelResource.paymentMethod.expirationMonth);
			expect(formattedRegisteredCard.systemProvider).to.equal(offsiteLoyalty.name);
		});
	});

	describe('Sync brands', function () {
		it('should get the brand list', async function () {
			offsiteLoyalty.setConnectorAndDetails(fidelResource.companyDetails);
			const result = await offsiteLoyalty.getBrandList(fidelResource.companyDetails);
			expect(result).to.be.an('array').with.lengthOf.at.least(1);
			const brand: OffsiteBrand = result[0];
			expect(brand.name).to.be.a('string').with.lengthOf.at.least(1);
		});
	});
});
