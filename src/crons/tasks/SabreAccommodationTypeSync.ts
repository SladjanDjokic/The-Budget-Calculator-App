import CronTask from '../CronTask';
import Company from '../../database/objects/company.db';
import dbSingleton from '../../database/dbSingleton';
import serviceFactory from '../../services/serviceFactory';
import agendaJs, { Agenda, AgendaIntervals } from '../../integrations/agenda/agendaJs';
import AgendaJobNames from '../../integrations/agenda/AgendaJobNames';
import cronTaskList from '../cronTaskList';
import { boundMethod } from 'autobind-decorator';
import logger from '../../utils/logger';
import AccommodationService from '../../services/accommodation/accommodation.service';

const TASK_NAME = 'Sabre Accommodation Type Sync';

export default class SabreAccommodationSync extends CronTask {
	accommodationService: AccommodationService;
	companyTable: Company = dbSingleton.get().company;
	constructor() {
		super();

		this.accommodationService = serviceFactory.get('AccommodationService');

		agendaJs.define(AgendaJobNames.SABRE_ACCOMMODATION_TYPE_SYNC, this.runJob);
		agendaJs.every(AgendaIntervals['12_HOURS'], TASK_NAME).catch(console.error);
		cronTaskList.register(this);
	}

	@boundMethod
	async runJob(job: Agenda.Job) {
		this.startTaskTimer();
		logger.info(`CRON: Running ${TASK_NAME}`);
		const companies = await this.companyTable.getCompanyIds();
		for (let company of companies) {
			if (!company.id) continue;
			await this.accommodationService.syncAndGetIntegrationAccommodationTypes(company.id);
		}
		this.endTaskTimer();
	}

	@boundMethod
	getName(): string {
		return TASK_NAME;
	}
}
