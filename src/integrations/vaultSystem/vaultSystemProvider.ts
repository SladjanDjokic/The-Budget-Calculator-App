import IServiceKeyTable, { ServiceKeyAndDetails } from '../../database/interfaces/IServiceKeyTable';
import logger from '../../utils/logger';
import Vault from './VaultSystem.class';
import { RsError } from '../../utils/errors';

const serviceType = 'VAULT';

export default class VaultSystemProvider {
	constructor(
		private readonly serviceKeyTable: IServiceKeyTable,
		private readonly availableVaultSystems: { [key: string]: Vault }
	) {}

	/**
	 * Get an available Vault system for a given company
	 * @param companyId
	 * @throws - will throw an error if no companyDetails are found or no Vault system is found
	 */
	async get(): Promise<{ system: Vault; companyDetails: ServiceKeyAndDetails }> {
		try {
			const companyDetails: ServiceKeyAndDetails = await this.serviceKeyTable.getServiceKeyAndCompanyDetails(
				serviceType
			);
			const system = this.availableVaultSystems[companyDetails.serviceName];
			return { system, companyDetails };
		} catch (e) {
			logger.info(`No ${serviceType} system found`);
			throw new RsError('SERVICE_UNAVAILABLE', `Unable to find ${serviceType} system`);
		}
	}
}
