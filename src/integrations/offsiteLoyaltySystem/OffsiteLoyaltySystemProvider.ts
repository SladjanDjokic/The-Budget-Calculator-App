import IServiceKeyTable, { ServiceKeyAndDetails } from '../../database/interfaces/IServiceKeyTable';
import logger from '../../utils/logger';
import { RsError } from '../../utils/errors';
import OffsiteLoyalty from './OffsiteLoyalty.class';

const serviceType = 'PAYMENT';

export default class OffsiteLoyaltySystemProvider {
	constructor(
		private readonly serviceKeyTable: IServiceKeyTable,
		private readonly availableOffsiteLoyaltySystems: {
			[key in Model.OffsiteLoyaltySystemProviders]: OffsiteLoyalty;
		}
	) {}

	/**
	 * Get an available OffsiteLoyalty system for a given company
	 * @param companyId
	 * @throws - will throw an error if no companyDetails are found or no OffsiteLoyalty system is found
	 */
	async get(companyId: number): Promise<{ system: OffsiteLoyalty; companyDetails: ServiceKeyAndDetails }> {
		try {
			const companyDetails: ServiceKeyAndDetails = await this.serviceKeyTable.getServiceKeyAndCompanyDetails(
				serviceType,
				companyId
			);
			const system = this.availableOffsiteLoyaltySystems[companyDetails.serviceName];
			return { system, companyDetails };
		} catch (e) {
			logger.info(`No ${serviceType} system found`, { companyId });
			throw new RsError('SERVICE_UNAVAILABLE', `Unable to find ${serviceType} system`);
		}
	}

	getOffsiteLoyaltySystems(): { [key in Model.OffsiteLoyaltySystemProviders]: OffsiteLoyalty } {
		return this.availableOffsiteLoyaltySystems;
	}
}
