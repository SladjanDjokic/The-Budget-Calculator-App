import CronTask from '../CronTask';
import agendaJs, { Agenda, AgendaIntervals } from '../../integrations/agenda/agendaJs';
import AgendaJobNames from '../../integrations/agenda/AgendaJobNames';
import cronTaskList from '../cronTaskList';
import logger from '../../utils/logger';
import dbSingleton from '../../database/dbSingleton';
import BrandService from '../../services/brand/brand.service';
import serviceFactory from '../../services/serviceFactory';
import { OffsiteBrand } from '../../integrations/offsiteLoyaltySystem/OffsiteLoyalty.class';
import { boundMethod } from 'autobind-decorator';
import ICompanyTable from '../../database/interfaces/ICompanyTable';

const TASK_NAME = 'Offsite Brand Sync';

export default class OffsiteBrandSync extends CronTask {
	companyTable: ICompanyTable = dbSingleton.get().company;
	brandService: BrandService;

	constructor() {
		super();
		this.brandService = serviceFactory.get<BrandService>('BrandService');
		agendaJs.define(AgendaJobNames.OFFSITE_BRAND_SYNC, this.runJob);
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
			try {
				logger.info(`Getting brands for company ${company.id}`);
				const localBrands: Model.Brand[] = await this.brandService.getAllForCompany(company.id);
				const offsiteBrands: OffsiteBrand[] = await this.brandService.getOffsiteBrandList(company.id);

				for (let brand of offsiteBrands) {
					logger.info(`Syncing brand ${brand.name}`);
					const localBrand: Model.Brand = localBrands.find((localBrand) => {
						return localBrand.externalId === brand.externalId || localBrand.name === brand.name;
					});
					if (!localBrand) await this.brandService.create({ ...brand, companyId: company.id });
					else await this.brandService.update({ id: localBrand.id, ...brand }, company.id);
				}
			} catch (e) {
				logger.info(`Failed to get offsite loyalty for ${company.id}`);
				logger.error(JSON.stringify(e));
			}
		}
		this.endTaskTimer();
	}

	getName(): string {
		return TASK_NAME;
	}
}
