import { Service } from '../Service';
import { AddPayment } from '../../integrations/paymentSystem/Payment.class';
import Company from '../../database/objects/company.db';
import UserPaymentMethod from '../../database/objects/userPaymentMethod.db';
import ServiceKey from '../../database/objects/serviceKey.db';
import logger from '../../utils/logger';
import { ServiceKeysAndDetails } from '../../database/interfaces/IServiceKeyTable';
import OffsiteLoyaltySystemProvider from '../../integrations/offsiteLoyaltySystem/OffsiteLoyaltySystemProvider';
import OffsiteLoyalty from '../../integrations/offsiteLoyaltySystem/OffsiteLoyalty.class';
import IPaymentService from './IPaymentService';
import VaultSystemProvider from '../../integrations/vaultSystem/vaultSystemProvider';
import { ServiceName as ServiceFactoryKey } from '../serviceFactory';

export default class PaymentService extends Service implements IPaymentService {
	constructor(
		private readonly vaultSystemProvider: VaultSystemProvider,
		private readonly offsiteLoyaltySystemProvider: OffsiteLoyaltySystemProvider,
		private readonly companyTable: Company,
		private readonly userPaymentMethodTable: UserPaymentMethod,
		private readonly serviceKeyTable: ServiceKey
	) {
		super();
	}

	start(services: { [key in ServiceFactoryKey]: Service }) {}

	async getAvailablePaymentMethods(
		paymentMethods: Api.Order.Req.PaymentMethods,
		companyId: number
	): Promise<Api.Order.Res.PaymentMethods> {
		const { system, companyDetails } = await this.vaultSystemProvider.get();
		return await system.getAvailablePaymentMethods(companyDetails, paymentMethods);
	}

	async addPayment(paymentTokenDetails: AddPayment, companyId: number): Promise<Api.Payment.Res.Create> {
		const { system, companyDetails } = await this.vaultSystemProvider.get();
		const clientPaymentDetails = system.formatClientCard(companyDetails, paymentTokenDetails);
		const createdClientPaymentMethod: Model.UserPaymentMethod = await this.userPaymentMethodTable.create({
			userId: paymentTokenDetails.userId,
			userAddressId: paymentTokenDetails.userAddressId,
			...clientPaymentDetails
		});
		try {
			if (paymentTokenDetails.offsiteLoyaltyEnrollment)
				await this.createOffsiteLoyaltyEnrollment(createdClientPaymentMethod, companyId);
			return createdClientPaymentMethod;
		} catch (e) {
			if (e.err === 'SERVICE_UNAVAILABLE') return createdClientPaymentMethod;
			await this.userPaymentMethodTable.delete(createdClientPaymentMethod.id);
			throw e;
		}
	}

	getClientGatewayPublic(): Promise<Api.Payment.Res.PublicData> {
		return this.companyTable.getClientGatewayPublic();
	}

	getActiveByUserId(userId: number): Promise<Model.UserPaymentMethod> {
		return this.userPaymentMethodTable.getActiveByUserId(userId);
	}

	async delete(userPaymentMethodId: number): Promise<number> {
		await this.deleteOffsiteLoyalty(userPaymentMethodId);
		return this.userPaymentMethodTable.delete(userPaymentMethodId);
	}

	update(paymentUpdate: Api.Payment.Req.Update): Promise<Model.UserPaymentMethod> {
		return this.userPaymentMethodTable.update(paymentUpdate.id, paymentUpdate);
	}

	async createOffsiteLoyaltyEnrollment(
		createdClientPaymentMethod: Model.UserPaymentMethod,
		companyId: number
	): Promise<Model.UserPaymentMethod[]> {
		const {
			services,
			...companyDetails
		}: ServiceKeysAndDetails = await this.serviceKeyTable.getServiceKeysAndCompanyDetails('OFFSITE_LOYALTY');
		const availableLoyaltySystemProviders = this.offsiteLoyaltySystemProvider.getOffsiteLoyaltySystems();
		const createdLoyaltyCards: Model.UserPaymentMethod[] = [];
		for (let service of services) {
			companyDetails['serviceKey'] = service.serviceKey;
			try {
				const createdLoyaltyCard = await availableLoyaltySystemProviders[service.serviceName].register(
					companyDetails,
					createdClientPaymentMethod,
					this.vaultSystemProvider
				);
				const createdPaymentMethod: Model.UserPaymentMethod = await this.userPaymentMethodTable.create({
					...createdLoyaltyCard,
					userId: createdClientPaymentMethod.userId,
					userAddressId: createdClientPaymentMethod.userAddressId,
					nameOnCard: createdClientPaymentMethod.nameOnCard
				});
				createdLoyaltyCards.push(createdPaymentMethod);
			} catch (e) {
				if (e.err === 'BAD_REQUEST' && e.msg === 'Card already linked')
					logger.info(
						`REGISTERED CARD (id: ${createdClientPaymentMethod.id}) WAS ATTEMPTING TO BE RE-REGISTERED`,
						createdClientPaymentMethod
					);
				else throw e;
			}
		}
		return createdLoyaltyCards;
	}

	getPaymentMethodByToken(paymentToken: string): Promise<Model.UserPaymentMethod> {
		return this.userPaymentMethodTable.getByToken(paymentToken);
	}

	private async deleteOffsiteLoyalty(userPaymentMethodId: number) {
		const {
			services,
			...companyDetails
		}: ServiceKeysAndDetails = await this.serviceKeyTable.getServiceKeysAndCompanyDetails('OFFSITE_LOYALTY');
		const availableLoyaltySystemProviders: {
			[key in Model.OffsiteLoyaltySystemProviders]: OffsiteLoyalty;
		} = this.offsiteLoyaltySystemProvider.getOffsiteLoyaltySystems();
		if (!Object.keys(availableLoyaltySystemProviders).length) return;
		const userPaymentMethod: Model.UserPaymentMethod = await this.userPaymentMethodTable.getById(
			userPaymentMethodId
		);
		for (let service of services) {
			companyDetails['serviceKey'] = service.serviceKey;
			await availableLoyaltySystemProviders[service.serviceName].delete(companyDetails, userPaymentMethod);
		}
	}
}
