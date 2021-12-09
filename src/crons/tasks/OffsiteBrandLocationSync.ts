import CronTask from '../CronTask';
import agendaJs, { Agenda, AgendaIntervals } from '../../integrations/agenda/agendaJs';
import AgendaJobNames from '../../integrations/agenda/AgendaJobNames';
import cronTaskList from '../cronTaskList';
import logger from '../../utils/logger';
import dbSingleton from '../../database/dbSingleton';
import BrandService from '../../services/brand/brand.service';
import serviceFactory from '../../services/serviceFactory';
import { OffsiteBrandLocation } from '../../integrations/offsiteLoyaltySystem/OffsiteLoyalty.class';
import { boundMethod } from 'autobind-decorator';
import ICompanyTable from '../../database/interfaces/ICompanyTable';

const TASK_NAME = 'Offsite Brand Location Sync';

export default class OffsiteBrandLocationSync extends CronTask {
	companyTable: ICompanyTable = dbSingleton.get().company;
	brandService: BrandService;

	constructor() {
		super();
		this.brandService = serviceFactory.get<BrandService>('BrandService');
		agendaJs.define(AgendaJobNames.OFFSITE_BRAND_LOCATION_SYNC, this.runJob);
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
				const localBrands: Model.Brand[] = await this.brandService.getAllForCompany(company.id);
				for (let brand of localBrands) {
					const localBrandLocations: Model.BrandLocation[] = await this.brandService.getLocationsForBrand(
						brand.id,
						company.id
					);
					const offsiteBrands: OffsiteBrandLocation[] = await this.brandService.getOffsiteBrandLocations(
						company.id,
						brand.externalId
					);
					await this.updateBrandLocations(localBrandLocations, offsiteBrands);
					await this.createBrandLocations(brand.id, localBrandLocations, offsiteBrands);
				}
			} catch (e) {
				logger.error(JSON.stringify(e));
			}
		}
		this.endTaskTimer();
	}

	getName(): string {
		return TASK_NAME;
	}

	private async updateBrandLocations(
		localBrandLocations: Model.BrandLocation[],
		offsiteBrands: OffsiteBrandLocation[]
	) {
		for (let localLocation of localBrandLocations) {
			const offsiteLocation: OffsiteBrandLocation = offsiteBrands.find((location) => {
				return location.externalId === localLocation.externalId;
			});
			if (!offsiteLocation) continue;
			const locationDetails: Partial<Model.BrandLocation> = {
				id: localLocation.id,
				name: localLocation.name,
				...offsiteLocation
			};
			await this.brandService.updateLocation(locationDetails.id, locationDetails);
		}
	}

	private async createBrandLocations(
		brandId,
		localBrandLocations: Model.BrandLocation[],
		offsiteBrandLocations: OffsiteBrandLocation[]
	) {
		for (let brandLocation of offsiteBrandLocations) {
			const offsiteLocation: OffsiteBrandLocation = localBrandLocations.find((location) => {
				return location.externalId === brandLocation.externalId;
			});
			if (offsiteLocation) continue;
			logger.info('Creating Brand Location');
			await this.brandService.createLocation({ brandId: brandId, ...brandLocation });
		}
	}
}
