import logger from '../../utils/logger';
import IServiceKeyTable from '../../database/interfaces/IServiceKeyTable';
import DestinationSystem from './destinationSystem';
import { RsError } from '../../utils/errors';

export default class DestinationSystemProvider {
	constructor(
		public serviceKeyTable: IServiceKeyTable,
		private availableDestinationSystems: { [key: string]: DestinationSystem }
	) {}

	async get(companyId: number) {
		try {
			const companyDetails = await this.serviceKeyTable.getServiceKeyAndCompanyDetails('DESTINATION', companyId);
			const system: DestinationSystem = this.availableDestinationSystems[companyDetails.serviceName];
			if (!system) {
				logger.error(`No available destination system called ${companyDetails.serviceName}`);
				return null;
			}
			return { system, companyDetails };
		} catch (e) {
			if (e instanceof RsError) {
				if (e.err === 'NOT_FOUND') {
					logger.warn(`Destination service key not found for company ${companyId}`);
				} else {
					logger.warn(`${e.err}: ${e.msg}\r\n${e.stack}`);
				}
				return null;
			}
			logger.error('Destination system not found:' + (e as Error).message);
		}
	}
}
