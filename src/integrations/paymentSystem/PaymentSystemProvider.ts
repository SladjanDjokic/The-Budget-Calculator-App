import IServiceKeyTable, { ServiceKeyAndDetails } from '../../database/interfaces/IServiceKeyTable';
import logger from '../../utils/logger';
import Payment from './Payment.class';
import { RsError } from '../../utils/errors';

const serviceType = 'PAYMENT';

export default class PaymentSystemProvider {
	constructor(
		private readonly serviceKeyTable: IServiceKeyTable,
		private readonly availablePaymentSystems: { [key: string]: Payment }
	) {}

	/**
	 * Get an available Payment system for a given company
	 * @param companyId
	 * @throws - will throw an error if no companyDetails are found or no Payment system is found
	 */
	async get(companyId: number): Promise<{ system: Payment; companyDetails: ServiceKeyAndDetails }> {
		try {
			const companyDetails: ServiceKeyAndDetails = await this.serviceKeyTable.getServiceKeyAndCompanyDetails(
				serviceType,
				companyId
			);
			const system = this.availablePaymentSystems[companyDetails.serviceName];
			return { system, companyDetails };
		} catch (e) {
			logger.info(`No ${serviceType} system found`, { companyId });
			throw new RsError('SERVICE_UNAVAILABLE', `Unable to find ${serviceType} system`);
		}
	}
}
