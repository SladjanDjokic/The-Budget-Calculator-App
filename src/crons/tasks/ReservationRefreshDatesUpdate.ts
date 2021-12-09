import CronTask from '../CronTask';
import agendaJs, { Agenda, AgendaIntervals } from '../../integrations/agenda/agendaJs';
import AgendaJobNames from '../../integrations/agenda/AgendaJobNames';
import { boundMethod } from 'autobind-decorator';
import logger from '../../utils/logger';
import cronTaskList from '../cronTaskList';
import serviceFactory from '../../services/serviceFactory';
import ReservationService from '../../services/reservation/reservation.service';

const TASK_NAME = 'Reservation Refresh Dates Update';

export default class ReservationRefreshDatesUpdate extends CronTask {
	reservationService: ReservationService;
	constructor() {
		super();
		this.reservationService = serviceFactory.get('ReservationService');

		agendaJs.define(AgendaJobNames.RESERVATION_REFRESH_DATES_UPDATE, { priority: 'high' }, this.runJob);
		agendaJs.every(AgendaIntervals['1_HOUR'], TASK_NAME).catch(console.error);
		cronTaskList.register(this);
	}

	@boundMethod
	async runJob(job: Agenda.Job) {
		this.startTaskTimer();
		logger.info(`CRON: Running ${TASK_NAME}`);
		await this.reservationService.updateReservationRefreshDates();
		this.endTaskTimer();
	}

	@boundMethod
	getName(): string {
		return TASK_NAME;
	}
}
