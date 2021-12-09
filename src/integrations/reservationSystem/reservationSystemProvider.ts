import logger from '../../utils/logger';
import IServiceKeyTable from '../../database/interfaces/IServiceKeyTable';
import ReservationSystem from './reservationSystem.class';
import { RsError } from '../../utils/errors';

export default class ReservationSystemProvider {
	constructor(
		public serviceKeyTable: IServiceKeyTable,
		private availableReservationSystems: {
			[key: string]: ReservationSystem;
		}
	) {}

	async get(companyId: number) {
		try {
			const companyDetails = await this.serviceKeyTable.getServiceKeyAndCompanyDetails('RESERVATION', companyId);
			const system: ReservationSystem = this.availableReservationSystems[companyDetails.serviceName];
			if (!system) {
				logger.error(`No available reservation system called ${companyDetails.serviceName}`);
				return null;
			}
			return { system, companyDetails };
		} catch (e) {
			if (e instanceof RsError) {
				if (e.err === 'NOT_FOUND') {
					logger.warn(`Reservation service key not found for company ${companyId}`);
				} else {
					logger.warn(`${e.err}: ${e.msg}\r\n${e.stack}`);
				}
				return null;
			}
			logger.error('Reservation system not found:' + (e as Error).message);
		}
	}
}
