import IDestinationTable from '../interfaces/IDestinationTable';
import AccommodationTableMock from './accommodation.db.mock';
import TableMock from './table.db.mock';
import destinationTableResource from '../../test/resources/destination.db.resource';

interface SizeInfo {
	max?: number;
	min?: number;
	units?: 'SquareFeet' | string;
}

export default class DestinationTableMock extends TableMock implements IDestinationTable {
	columns: string[];
	readonly DestinationDetails: Api.Destination.Res.Details;
	lastIdPassed: number | number[];
	updateCalls: number = 0;
	getForCompanyCalls: number = 0;
	getCalls: number = 0;
	getManyCalls: number = 0;
	getDetailsCalls: number = 0;
	getByPageCalls: number = 0;
	getAvailableCalls: number = 0;

	constructor(
		public readonly Destinations: Model.Destination[],
		public readonly AccommodationTable: AccommodationTableMock
	) {
		super();
		if (!!Destinations.length) {
			this.DestinationDetails = {
				...Destinations[0],
				externalId: Destinations[0].externalSystemId,
				minBedroom: 1,
				maxBedroom: 5,
				minBathroom: 1,
				maxBathroom: 5,
				propertyTypes: [],
				regions: [],
				experiences: [],
				media: [],
				packages: [],
				accommodations: [],
				accommodationTypes: [],
				policies: null
			};
		}
	}
	async getAvailable(
		destinationIds: number[],
		propertyTypeIds?: number[],
		regionIds?: number[],
		bedroomCount?: number,
		bathroomCount?: number,
		companyId?: number
	): Promise<Api.Destination.Res.Availability[]> {
		this.getAvailableCalls++;
		this.lastIdPassed = destinationIds;
		const baseDestination = this.Destinations[0];
		const result: Api.Destination.Res.Availability = {
			...baseDestination,
			minBedroom: 1,
			maxBedroom: 5,
			minBathroom: 1,
			maxBathroom: 5,
			minAccommodationPrice: 0,
			minAccommodationPoints: 0,
			accommodationTypes: [],
			propertyTypes: [],
			media: [],
			experiences: [],
			accommodations: this.AccommodationTable.accommodations.map(this.buildAccommodations)
		};
		return [result];
	}

	getDestinationRegions(destinationId: number): Promise<Api.Destination.Res.DestinationRegion[]> {
		return Promise.resolve(destinationTableResource.destinationRegions);
	}

	updateDestinationRegions(destinationId: number, regions: number[]): void {}

	updatePropertyTypes(DestinationId: number, propertyTypes: number[]): void {}

	getAllPropertyTypes(): Promise<Api.Destination.Res.PropertyType[]> {
		return Promise.resolve([]);
	}

	async update(id: number, tableObj: any) {
		this.updateCalls++;
		this.lastIdPassed = id;
		for (let i in tableObj) {
			this.DestinationDetails[i] = tableObj[i];
		}
		return this.DestinationDetails;
	}
	async getForCompany(companyId: number) {
		this.getForCompanyCalls++;
		return this.Destinations.filter((d) => d.companyId === companyId);
	}

	async getById(objId: number, companyId?: number): Promise<Model.Destination> {
		this.getCalls++;
		this.lastIdPassed = objId;
		let results = this.Destinations.filter((dest) => dest.id === objId);
		if (companyId) results = results.filter((d) => d.companyId === companyId);
		return results.length > 0 ? results[0] : null;
	}

	async getManyByIds(objIds: number[], companyId?: number): Promise<Model.Destination[]> {
		this.getManyCalls++;
		this.lastIdPassed = objIds;
		let results = this.Destinations.filter((dest) => objIds.includes(dest.id));
		if (companyId) results = results.filter((d) => d.companyId === companyId);
		return results.length > 0 ? results : [];
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId: number
	): Promise<RedSky.RsPagedResponseData<Api.Destination.Res.Details[]>> {
		this.getByPageCalls++;
		return { data: [this.DestinationDetails], total: this.getByPageCalls };
	}

	async getDestinationDetails(destinationId: number): Promise<Api.Destination.Res.Details> {
		this.getDetailsCalls++;
		this.lastIdPassed = destinationId;
		return this.DestinationDetails;
	}

	create: null;
	updateMany: null;
	delete: null;
	deleteMany: null;

	getPropertyTypes(destinationId: number): Promise<Api.Destination.Res.PropertyType[]> {
		return Promise.resolve(destinationTableResource.propertyTypes);
	}

	private buildAccommodations(accommodation: Model.Accommodation): Api.Destination.Res.Accommodation {
		const sizeInfo: SizeInfo = JSON.parse(accommodation.size || '{}');
		const baseAccommodation: Api.Destination.Res.Accommodation = { ...accommodation, amenities: [], prices: [] };

		if (sizeInfo.units === 'SquareFeet') {
			if (sizeInfo.min && sizeInfo.units) baseAccommodation.minSquareFt = sizeInfo.min;
			if (sizeInfo.max) baseAccommodation.maxSquareFt = sizeInfo.max;
		}

		return baseAccommodation;
	}
}
