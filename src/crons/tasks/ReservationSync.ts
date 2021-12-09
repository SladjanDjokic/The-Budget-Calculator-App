import CronTask from '../CronTask';
import agendaJs, { Agenda, AgendaIntervals } from '../../integrations/agenda/agendaJs';
import AgendaJobNames from '../../integrations/agenda/AgendaJobNames';
import { boundMethod } from 'autobind-decorator';
import logger from '../../utils/logger';
import cronTaskList from '../cronTaskList';
import serviceFactory from '../../services/serviceFactory';
import ReservationService from '../../services/reservation/reservation.service';

const TASK_NAME = 'Reservation Sync';

export default class ReservationSync extends CronTask {
	reservationService: ReservationService;
	constructor() {
		super();
		this.reservationService = serviceFactory.get<ReservationService>('ReservationService');
		agendaJs.define(AgendaJobNames.RESERVATION_SYNC, this.runJob);
		agendaJs.every(AgendaIntervals['5_MINUTES'], TASK_NAME).catch(console.error);
		cronTaskList.register(this);
	}

	@boundMethod
	async runJob(job: Agenda.Job) {
		this.startTaskTimer();
		logger.info(`CRON: Running ${TASK_NAME}`);
		await this.reservationService.syncReservations();
		this.endTaskTimer();
	}

	@boundMethod
	getName(): string {
		return TASK_NAME;
	}
}
