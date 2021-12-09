import CronTask from '../CronTask';
import serviceFactory from '../../services/serviceFactory';
import agendaJs, { Agenda, AgendaIntervals } from '../../integrations/agenda/agendaJs';
import AgendaJobNames from '../../integrations/agenda/AgendaJobNames';
import cronTaskList from '../cronTaskList';
import { boundMethod } from 'autobind-decorator';
import logger from '../../utils/logger';
import ReservationService from '../../services/reservation/reservation.service';

const TASK_NAME = 'Rate Sync';

export default class RateSync extends CronTask {
	private readonly reservationService: ReservationService;
	constructor() {
		super();

		this.reservationService = serviceFactory.get('ReservationService');

		agendaJs.define(AgendaJobNames.RATE_SYNC, this.runJob);
		agendaJs.every(AgendaIntervals['NIGHTLY'], TASK_NAME).catch(logger.error);
		cronTaskList.register(this);
	}

	@boundMethod
	async runJob(job: Agenda.Job) {
		this.startTaskTimer();
		logger.info(`CRON: Running ${TASK_NAME}`);
		await this.reservationService.syncRates();
		this.endTaskTimer();
	}

	@boundMethod
	getName(): string {
		return TASK_NAME;
	}
}
