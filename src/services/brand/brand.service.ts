import { Service } from '../Service';
import OffsiteLoyaltySystemProvider from '../../integrations/offsiteLoyaltySystem/OffsiteLoyaltySystemProvider';
import IServiceKeyTable, { ServiceKeysAndDetails, ServiceInfo } from '../../database/interfaces/IServiceKeyTable';
import OffsiteLoyalty, {
	OffsiteBrand,
	OffsiteBrandLocation
} from '../../integrations/offsiteLoyaltySystem/OffsiteLoyalty.class';
import BrandLocation from '../../database/objects/brandLocation.db';
import IBrandTable, { BrandUpdate } from '../../database/interfaces/IBrandTable';
import logger from '../../utils/logger';
import { ServiceName } from '../serviceFactory';

interface OffsiteCompanyKeysAndProviders {
	services: ServiceInfo[];
	companyDetails: Model.Company;
	availableLoyaltySystemProviders: { [key in Model.OffsiteLoyaltySystemProviders]: OffsiteLoyalty };
}

export interface BrandToCreate {
	companyId: number;
	name: string;
	externalId: string | number;
	metaData: string;
}

export default class BrandService extends Service {
	constructor(
		private readonly brandTable: IBrandTable,
		private readonly offsiteLoyaltySystemProvider: OffsiteLoyaltySystemProvider,
		private readonly serviceKeyTable: IServiceKeyTable,
		private readonly brandLocationTable: BrandLocation
	) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {}

	async getLocationsForCompany(companyId: number): Promise<Model.BrandLocation[]> {
		return [];
	}

	async getOffsiteBrandList(companyId: number): Promise<OffsiteBrand[]> {
		const {
			services,
			companyDetails,
			availableLoyaltySystemProviders
		} = await this.getOffsiteCompanyKeysAndProviders(companyId);
		let offsiteBrandList: OffsiteBrand[] = [];
		logger.info(`Getting offsite loyalty services`);
		for (let service of services) {
			try {
				companyDetails['serviceKey'] = service.serviceKey;
				logger.info(`getting brands from ${service.serviceName}`);
				const offsiteBrands: OffsiteBrand[] = await availableLoyaltySystemProviders[
					service.serviceName
				].getBrandList(companyDetails);
				offsiteBrandList = offsiteBrandList.concat(offsiteBrands);
			} catch (e) {
				logger.error(
					`Unable to get brand list from ${service.serviceName} for company ${
						companyDetails.id
					}:\r\n${JSON.stringify(e)}`
				);
			}
		}
		return offsiteBrandList;
	}

	async getOffsiteBrandLocations(companyId: number, externalBrandId: string): Promise<OffsiteBrandLocation[]> {
		const {
			services,
			companyDetails,
			availableLoyaltySystemProviders
		} = await this.getOffsiteCompanyKeysAndProviders(companyId);
		let offsiteBrandLocationsList: OffsiteBrandLocation[] = [];
		for (let service of services) {
			companyDetails['serviceKey'] = service.serviceKey;
			const offsiteBrandLocations: OffsiteBrandLocation[] = await availableLoyaltySystemProviders[
				service.serviceName
			].getBrandLocations(companyDetails, externalBrandId);
			offsiteBrandLocationsList = offsiteBrandLocationsList.concat(offsiteBrandLocations);
		}
		return offsiteBrandLocationsList;
	}

	getAll(): Promise<Model.Brand[]> {
		return this.brandTable.getAll();
	}

	getAllForCompany(companyId: number): Promise<Model.Brand[]> {
		try {
			return this.brandTable.getAllForCompany(companyId);
		} catch (e) {
			if (e.err !== 'NOT_FOUND') logger.error(JSON.stringify(e));
			return Promise.resolve([]);
		}
	}

	create(brand: BrandToCreate): Promise<Model.Brand> {
		return this.brandTable.create(brand);
	}

	update(updateDetails: BrandUpdate, companyId: number): Promise<Model.Brand> {
		return this.brandTable.update(updateDetails.id, updateDetails, companyId);
	}

	getLocationsForBrand(brandId: number, companyId: number): Promise<Model.BrandLocation[]> {
		try {
			return this.brandLocationTable.getForBrand(brandId, companyId);
		} catch (e) {
			if (e.err !== 'NOT_FOUND') logger.error(JSON.stringify(e));
			return Promise.resolve([]);
		}
	}

	updateLocation(id: number, locationDetails: Partial<Model.BrandLocation>): Promise<Model.BrandLocation> {
		return this.brandLocationTable.update(id, locationDetails);
	}

	createLocation(locationDetails: Partial<Model.BrandLocation>): Promise<Model.BrandLocation> {
		return this.brandLocationTable.create(locationDetails);
	}

	private async getOffsiteCompanyKeysAndProviders(companyId?: number): Promise<OffsiteCompanyKeysAndProviders> {
		const {
			services,
			...companyDetails
		}: ServiceKeysAndDetails = await this.serviceKeyTable.getServiceKeysAndCompanyDetails(
			'OFFSITE_LOYALTY',
			companyId
		);
		const availableLoyaltySystemProviders: {
			[key in Model.OffsiteLoyaltySystemProviders]: OffsiteLoyalty;
		} = this.offsiteLoyaltySystemProvider.getOffsiteLoyaltySystems();
		return { services, companyDetails, availableLoyaltySystemProviders };
	}
}
