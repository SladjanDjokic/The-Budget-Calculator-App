import CronTask from '../CronTask';
import agendaJs, { Agenda, AgendaIntervals } from '../../integrations/agenda/agendaJs';
import AgendaJobNames from '../../integrations/agenda/AgendaJobNames';
import { boundMethod } from 'autobind-decorator';
import logger from '../../utils/logger';
import cronTaskList from '../cronTaskList';
import serviceFactory from '../../services/serviceFactory';
import Company from '../../database/objects/company.db';
import dbSingleton from '../../database/dbSingleton';
import ReservationService from '../../services/reservation/reservation.service';
import { ObjectUtils } from '../../utils/utils';
import DestinationService from '../../services/destination/destination.service';

const TASK_NAME = 'Availability Block Sync';
const BLOCKS_PER_JOB: number = 4;

export default class SabreDataBlockSync extends CronTask {
	private readonly companyTable: Company;
	private readonly reservationService: ReservationService;
	private readonly destinationService: DestinationService;
	constructor() {
		super();
		this.companyTable = dbSingleton.get().company;
		this.reservationService = serviceFactory.get<ReservationService>('ReservationService');
		this.destinationService = serviceFactory.get<DestinationService>('DestinationService');

		agendaJs.define(AgendaJobNames.AVAILABILITY_BLOCK_SYNC, { priority: 'highest' }, this.runJob);
		agendaJs.every(AgendaIntervals['5_MINUTES'], TASK_NAME).catch(console.error);
		cronTaskList.register(this);
	}

	@boundMethod
	async runJob(job: Agenda.Job) {
		this.startTaskTimer();
		logger.info(`CRON: Running ${TASK_NAME}`);
		const companies = await this.companyTable.getCompanyIds();
		for (let company of companies) {
			if (!company.id) continue;
			const refreshBlockTimes = await this.reservationService.getAvailabilityRefreshKeys(company.id);
			if (!refreshBlockTimes) {
				logger.warn(`Unable to refresh blocks for company ID ${company.id}`);
				continue;
			}
			const companyDestinations = await this.destinationService.getForCompany(company.id);
			if (!ObjectUtils.isArrayWithData(companyDestinations)) continue;
			const sortedRefreshBlocks = ObjectUtils.simpleSort(refreshBlockTimes);
			for (let i = 0; i < BLOCKS_PER_JOB; i++) {
				const blockArray = sortedRefreshBlocks[Object.keys(sortedRefreshBlocks)[i]].split('-');
				let destinationId: number = parseInt(blockArray.shift());
				const companyDestination = companyDestinations.find((destination) => {
					return destination.id === destinationId;
				});
				if (!companyDestination) continue;
				try {
					await this.reservationService.syncAvailabilityBlock(
						company.id,
						sortedRefreshBlocks[Object.keys(sortedRefreshBlocks)[i]]
					);
				} catch (e) {
					if (e.err === 'CANNOT_RESERVE') logger.warn(JSON.stringify(e));
					else logger.error(JSON.stringify(e));
				}
			}
		}
		this.endTaskTimer();
	}

	@boundMethod
	getName(): string {
		return TASK_NAME;
	}
}
