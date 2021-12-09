import CronTask from '../CronTask';
import agendaJs, { Agenda, AgendaIntervals } from '../../integrations/agenda/agendaJs';
import AgendaJobNames from '../../integrations/agenda/AgendaJobNames';
import { boundMethod } from 'autobind-decorator';
import logger from '../../utils/logger';
import cronTaskList from '../cronTaskList';
import DestinationService from '../../services/destination/destination.service';
import serviceFactory from '../../services/serviceFactory';
import Company from '../../database/objects/company.db';
import dbSingleton from '../../database/dbSingleton';

const TASK_NAME = 'Sabre Destination Sync';

export default class SabreDestinationSync extends CronTask {
	destinationService: DestinationService;
	companyTable: Company = dbSingleton.get().company;
	constructor() {
		super();

		this.destinationService = serviceFactory.get('DestinationService');

		agendaJs.define(AgendaJobNames.SABRE_DESTINATION_SYNC, this.runJob);
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
			await this.destinationService.syncAndGetIntegrationDestinations(company.id);
		}
		this.endTaskTimer();
	}

	@boundMethod
	getName(): string {
		return TASK_NAME;
	}
}
