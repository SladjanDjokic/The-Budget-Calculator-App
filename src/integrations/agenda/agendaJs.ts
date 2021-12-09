import Agenda from 'agenda';
export { Agenda };
import config from '../../utils/config';
import logger from '../../utils/logger';
import AgendaMock from './AgendaMock';

export enum AgendaIntervals {
	'1_SECOND' = '1 second',
	'5_SECONDS' = '5 seconds',
	'10_SECONDS' = '10 seconds',
	'15_SECONDS' = '15 seconds',
	'30_SECONDS' = '30 seconds',
	'1_MINUTE' = '* * * * *',
	'5_MINUTES' = '*/5 * * * *',
	'10_MINUTES' = '*/10 * * * *',
	'15_MINUTES' = '*/15 * * * *',
	'30_MINUTES' = '*/30 * * * *',
	'1_HOUR' = '0 */1 * * *',
	'12_HOURS' = '0 */12 * * *',
	'24_HOURS' = '0 */24 * * *',
	'NIGHTLY' = '1 0 * * *'
}

export interface MongoDbConfig {
	host: string;
	collection: string;
	user: string;
	password: string;
}

class AgendaJs {
	agendaSingleton: any;
	private config: MongoDbConfig;
	private connectionString: string = '';
	constructor() {
		this.config = config.agendaDb;

		// mongodb://[username:password@]host1[:port1][,...hostN[:portN]][/[defaultauthdb][?options]]
		this.connectionString = `mongodb://${this.config.user}:${this.config.password}@${this.config.host}/admin`;
		this.agendaSingleton = config.enableAgenda
			? new Agenda({
					db: {
						address: this.connectionString,
						options: { useUnifiedTopology: true },
						collection: this.config.collection
					}
			  })
			: new AgendaMock();
	}
}

let agenda = new AgendaJs();
if (config.enableAgenda) {
	logger.info('Starting Agenda Cron Service');
	agenda.agendaSingleton.start();
}
export default agenda.agendaSingleton as Agenda;
