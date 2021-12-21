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

	getDetails(brandId: number, companyId?: number): Promise<Api.Brand.Res.Details> {
		return this.brandTable.getDetails(brandId, companyId);
	}

	getByPage(
		pageQuery: RedSky.PageQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Brand.Res.Details[]>> {
		return this.brandTable.getByPage(pageQuery.pagination, pageQuery.sort, pageQuery.filter, companyId);
	}

	getLocationDetails(brandLocationId: number): Promise<Api.Brand.Res.Location.Details> {
		return this.brandLocationTable.getDetails(brandLocationId);
	}

	getLocationsByPage(
		brandId: number,
		pageQuery: RedSky.PageQuery
	): Promise<RedSky.RsPagedResponseData<Api.Brand.Res.Location.Details[]>> {
		return this.brandLocationTable.getLocationsByPage(
			brandId,
			pageQuery.pagination,
			pageQuery.sort,
			pageQuery.filter
		);
	}

	create(brand: BrandToCreate): Promise<Model.Brand> {
		return this.brandTable.create(brand);
	}

	update(updateDetails: BrandUpdate, companyId: number): Promise<Api.Brand.Res.Details> {
		return this.brandTable.update(updateDetails.id, updateDetails, companyId);
	}

	getLocationsForBrand(brandId: number): Promise<Api.Brand.Res.Location.Details[]> {
		try {
			return this.brandLocationTable.getLocationsForBrand(brandId);
		} catch (e) {
			if (e.err !== 'NOT_FOUND') logger.error(JSON.stringify(e));
			return Promise.resolve([]);
		}
	}

	getReportsByPage(
		pageQuery: RedSky.PageQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Brand.Res.Report[]>> {
		return this.brandTable.getReportsByPage(pageQuery.pagination, pageQuery.sort, pageQuery.filter, companyId);
	}

	getBrandLocationTransactionsByPage(
		locationId: number,
		pageQuery: RedSky.PageQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Brand.Res.Location.Transaction[]>> {
		return this.brandLocationTable.getTransactionsByPage(
			locationId,
			pageQuery.pagination,
			pageQuery.sort,
			pageQuery.filter,
			companyId
		);
	}

	getLocationsOverviewByPage(
		locationId: number,
		pageQuery: RedSky.PageQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Brand.Res.Report[]>> {
		return this.brandLocationTable.getLocationsOverviewByPage(
			locationId,
			pageQuery.pagination,
			pageQuery.sort,
			pageQuery.filter,
			companyId
		);
	}

	exportLocationsOverviewReport(brandId: number, companyId?: number): Promise<Api.Brand.Res.Report[]> {
		return this.brandLocationTable.exportLocationsOverviewReport(brandId, companyId);
	}

	updateLocation(id: number, locationDetails: Partial<Model.BrandLocation>): Promise<Api.Brand.Res.Location.Details> {
		return this.brandLocationTable.update(id, locationDetails);
	}

	createLocation(locationDetails: Partial<Model.BrandLocation>): Promise<Model.BrandLocation> {
		return this.brandLocationTable.create(locationDetails);
	}

	exportBrandsReport(companyId: number): Promise<Api.Brand.Res.Report[]> {
		return this.brandTable.exportReports(companyId);
	}

	exportBrandLocationReport(
		brandLocationId: number,
		companyId?: number
	): Promise<Api.Brand.Res.Location.Transaction[]> {
		return this.brandLocationTable.exportReports(brandLocationId, companyId);
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
