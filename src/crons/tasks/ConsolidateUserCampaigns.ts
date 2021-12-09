import CronTask from '../CronTask';
import agendaJs, { Agenda, AgendaIntervals } from '../../integrations/agenda/agendaJs';
import AgendaJobNames from '../../integrations/agenda/AgendaJobNames';
import cronTaskList from '../cronTaskList';
import CampaignService from '../../services/campaign/campaign.service';
import { boundMethod } from 'autobind-decorator';
import logger from '../../utils/logger';
import UserService from '../../services/user/user.service';
import serviceFactory from '../../services/serviceFactory';
import Company from '../../database/objects/company.db';
import dbSingleton from '../../database/dbSingleton';

const TASK_NAME = 'Consolidate User Campaigns Sync';

export default class ConsolidateUserCampaigns extends CronTask {
	campaignService: CampaignService;
	userService: UserService;
	companyTable: Company = dbSingleton.get().company;

	constructor() {
		super();

		this.campaignService = serviceFactory.get<CampaignService>('CampaignService');
		this.userService = serviceFactory.get<UserService>('UserService');
		agendaJs.define(AgendaJobNames.CONSOLIDATE_USER_CAMPAIGN, this.runJob);
		agendaJs.every(AgendaIntervals['1_HOUR'], TASK_NAME).catch(console.error);
		cronTaskList.register(this);
	}

	@boundMethod
	async runJob(job: Agenda.Job) {
		this.startTaskTimer();
		logger.info(`CRON: Running ${TASK_NAME}`);
		const companies = await this.companyTable.getCompanyIds();
		for (let company of companies) {
			if (!company.id) continue;
			const userIds: number[] = await this.userService.getUserIdsWithAwardableActions();
			for (let userId of userIds) {
				await this.campaignService.consolidateUserCampaigns(userId, company.id);
			}
		}
		this.endTaskTimer();
	}

	getName(): string {
		return TASK_NAME;
	}
}
