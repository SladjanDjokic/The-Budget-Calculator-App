import { Service } from '../Service';
import IDestinationTable from '../../database/interfaces/IDestinationTable';
import { DateUtils, NumberUtils, ObjectUtils, RedisUtils } from '../../utils/utils';
import IMediaService from '../media/IMediaService';
import logger from '../../utils/logger';
import { IRedisClient } from '../../integrations/redis/IRedisClient';
import DestinationSystemProvider from '../../integrations/destinationSystem/destinationSystemProvider';
import DestinationSystem from '../../integrations/destinationSystem/destinationSystem';
import { ServiceKeyAndDetails } from '../../database/interfaces/IServiceKeyTable';
import ICompanyService from '../company/ICompanyService';
import { ServiceName } from '../serviceFactory';
import MediaService from '../media/media.service';
import CompanyService from '../company/company.service';
import AccommodationService from '../accommodation/accommodation.service';

export default class DestinationService extends Service {
	mediaService: IMediaService;
	companyService: ICompanyService;
	accommodationService: AccommodationService;

	constructor(
		private readonly destinationTable: IDestinationTable,
		private readonly destinationSystemProvider: DestinationSystemProvider,
		private readonly redisClient: IRedisClient
	) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.mediaService = services['MediaService'] as MediaService;
		this.companyService = services['CompanyService'] as CompanyService;
		this.accommodationService = services['AccommodationService'] as AccommodationService;
	}

	async syncAndGetIntegrationDestinations(companyId: number) {
		let system: DestinationSystem;
		let companyDetails: ServiceKeyAndDetails;
		try {
			({ system, companyDetails } = await this.destinationSystemProvider.get(companyId));
		} catch {
			logger.warn('Unable to get destination system');
			return null;
		}
		return await system.syncDestinationList(companyDetails);
	}

	getForCompany(companyId: number) {
		return this.destinationTable.getForCompany(companyId);
	}

	async getById(destinationId: number, companyId?: number): Promise<Model.Destination | null> {
		return await this.destinationTable.getById(destinationId, companyId);
	}

	getManyByIds(destinationIds: number[], companyId?: number) {
		return this.destinationTable.getManyByIds(destinationIds, companyId);
	}

	getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Destination.Res.Details[]>> {
		return this.destinationTable.getByPage(pagination, sort, filter, companyId);
	}

	async update(
		destinationId: number,
		destinationDetails: Api.Destination.Req.Update,
		companyId: number
	): Promise<Api.Destination.Res.Details> {
		const destinationMedia = destinationDetails.mediaIds;
		const propertyTypeIds = destinationDetails.propertyTypeIds;
		const regionIds = destinationDetails.regionIds;
		delete destinationDetails.mediaIds;
		delete destinationDetails.propertyTypeIds;
		delete destinationDetails.regionIds;
		if (ObjectUtils.isArrayWithData(propertyTypeIds))
			await this.updatePropertyTypes(destinationId, propertyTypeIds);
		if (ObjectUtils.isArrayWithData(regionIds)) await this.updateDestinationRegions(destinationId, regionIds);
		if (destinationMedia) await this.updateMediaMapAndSetMediaProperty(destinationMedia, { destinationId });
		return this.destinationTable.update(destinationId, destinationDetails, companyId);
	}

	async getDetails(request: Api.Destination.Req.Details, companyId?: number): Promise<Api.Destination.Res.Details> {
		const details = await this.destinationTable.getDestinationDetails(request.destinationId, companyId);
		if (!request.startDate || !request.endDate) return details;
		const availability = await this.accommodationService.getAvailable({
			...(request as Required<Api.Destination.Req.Details>),
			adultCount: 1,
			childCount: 0,
			sortOrder: 'ASC',
			pagination: null
		});
		details.lowestPriceInCents = Math.min(...availability.data.map((a) => a.costPerNightCents));
		return details;
	}

	getPropertyTypes(destinationId: number): Promise<Api.Destination.Res.PropertyType[]> {
		return this.destinationTable.getPropertyTypes(destinationId);
	}

	getAllPropertyTypes(): Promise<Api.Destination.Res.PropertyType[]> {
		return this.destinationTable.getAllPropertyTypes();
	}

	async getAvailable(
		searchOptions: Api.Destination.Req.Availability,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Destination.Res.Availability[]>> {
		const keyDateRange = DateUtils.getDateRange(searchOptions.startDate, searchOptions.endDate);
		if (!!!keyDateRange?.length) return { data: [], total: 0 };
		const searchKeys = await RedisUtils.getDestinationSearchKeys(keyDateRange, this.redisClient, companyId);
		if (!!!searchKeys?.length) return { data: [], total: 0 };
		const cacheKeyValues = await this.redisClient.getMany(searchKeys, false);
		if (!!!cacheKeyValues?.length) return { data: [], total: 0 };
		const availableList: Redis.Availability[] = this.filterQtyAndOptionalSearchAvailability(
			cacheKeyValues,
			searchOptions
		);
		if (!!!availableList?.length) return { data: [], total: 0 };
		const dedupedList: Redis.Availability[] = ObjectUtils.dedupe(availableList, 'destinationId');
		if (!!!dedupedList?.length) {
			logger.error('Deduplication error', availableList);
			return { data: [], total: 0 };
		}
		const ids: number[] = dedupedList.map((d) => d.destinationId);
		let data = await this.destinationTable.getAvailable(
			ids,
			searchOptions.propertyTypeIds,
			searchOptions.regionIds,
			searchOptions.bedroomCount,
			searchOptions.bathroomCount
		);

		data = data.reduce<Api.Destination.Res.Availability[]>((destinationArray, destination) => {
			if (!ObjectUtils.isArrayWithData(destination.accommodations)) return destinationArray;

			destination.accommodations.forEach((accommodation) => {
				if (!accommodation.maxSquareFt) delete accommodation.maxSquareFt;
				if (!accommodation.minSquareFt) delete accommodation.minSquareFt;
			});

			destinationArray.push(destination);
			return destinationArray;
		}, []);

		if (searchOptions.amenityIds) {
			data = data.reduce<Api.Destination.Res.Availability[]>((destinationArray, destination) => {
				destination.accommodations = destination.accommodations.filter((accommodation) => {
					return !!accommodation.amenities.find((amenity) => searchOptions.amenityIds.includes(amenity.id));
				});
				if (!ObjectUtils.isArrayWithData(destination.accommodations)) return destinationArray;

				destinationArray.push(destination);
				return destinationArray;
			}, []);
		}

		if (searchOptions.experienceIds) {
			data = data.filter((destination) => {
				return !!destination.experiences.find((experience) =>
					searchOptions.experienceIds.includes(experience.id)
				);
			});
		}
		const redemptionRatio = await this.companyService.getRedemptionPointRatio();
		data = DestinationService.finalizeAvailableAccommodations(data, dedupedList, redemptionRatio);
		data.sort((destination1, destination2) => {
			if (!destination1.minAccommodationPrice) return 1;
			return destination1.minAccommodationPrice - destination2.minAccommodationPrice;
		});
		if (searchOptions.sortOrder === 'DESC') {
			data.reverse();
		}
		const total = data.length;
		let paginatedList = ObjectUtils.paginateArray(
			data,
			searchOptions.pagination.page,
			searchOptions.pagination.perPage
		);
		if (!!!paginatedList?.length) {
			logger.error('Pagination error', paginatedList, searchOptions.pagination);
			return { data: [], total };
		}
		return { data: paginatedList, total };
	}

	private static finalizeAvailableAccommodations(
		destinations: Api.Destination.Res.Availability[],
		cacheResults: Redis.Availability[],
		redemptionRatio
	): Api.Destination.Res.Availability[] {
		for (let destination of destinations) {
			const cacheDestination = cacheResults.find((d) => d.destinationId === destination.id);
			const updatedAccommodations = [];
			for (let accommodation of destination.accommodations) {
				const cacheAccommodation = cacheDestination.accommodations.find((a) => a.id === accommodation.id);
				if (!!!cacheAccommodation) continue;
				accommodation.priceCents = 0;
				accommodation.prices = cacheAccommodation.price.map((price) => {
					return {
						priceCents: price.total,
						pricePoints: NumberUtils.centsToPoints(price.total, redemptionRatio),
						quantityAvailable: price.qtyAvailable,
						rate: price.rate,
						minStay: price.minStay || 1
					};
				});
				updatedAccommodations.push(accommodation);
			}

			destination.accommodations = [...updatedAccommodations];
			if (updatedAccommodations.length < 1) {
				destination.minAccommodationPoints = undefined;
				destination.minAccommodationPrice = undefined;
			} else {
				destination.minAccommodationPrice = Math.min(
					...updatedAccommodations.map((accommodation) => {
						return Math.min(...accommodation.prices.map((price) => price.priceCents));
					})
				);
				destination.minAccommodationPoints = Math.min(
					...updatedAccommodations.map((accommodation) => {
						return Math.min(...accommodation.prices.map((price) => price.pricePoints));
					})
				);
			}
		}
		return destinations.filter((destination) => ObjectUtils.isArrayWithData(destination.accommodations));
	}

	private async updatePropertyTypes(destinationId: number, propertyTypes: number[]) {
		await this.destinationTable.updatePropertyTypes(destinationId, propertyTypes);
	}

	private async updateDestinationRegions(destinationId: number, regionIds: number[]) {
		await this.destinationTable.updateDestinationRegions(destinationId, regionIds);
	}

	private async updateMediaMapAndSetMediaProperty(
		featureMedia: Api.MediaDetails[],
		mediaMapKey: { [key: string]: number }
	) {
		const mediaMapKeys: Model.MediaMap[] = await this.mediaService.getImageMapsByKeyId(mediaMapKey);
		const mediaIds: number[] = mediaMapKeys.map((media) => {
			return media.mediaId;
		});
		const mediaToUpdate = featureMedia.filter((media) => {
			if (mediaIds.includes(media.id)) return media;
		});
		const mediaToCreate = featureMedia.filter((media) => {
			if (!mediaIds.includes(media.id)) return media;
		});
		if (ObjectUtils.isArrayWithData(mediaToCreate))
			await this.createMediaMapAndSetMediaProperty(mediaToCreate, mediaMapKey);
		for (let media of mediaToUpdate) {
			await this.mediaService.update(media.id, { isPrimary: media.isPrimary });
		}
	}

	private async createMediaMapAndSetMediaProperty(
		featureMedia: Api.MediaDetails[],
		mediaMapKey: { [key: string]: number }
	) {
		for (let mediaItem of featureMedia) {
			await this.mediaService.createMediaMapAndSetMediaProperty(mediaItem.id, mediaMapKey, {
				isPrimary: mediaItem.isPrimary
			});
		}
	}

	private filterQtyAndOptionalSearchAvailability(
		cacheKeyValues: string[],
		searchOptions: Api.Destination.Req.Availability
	): Redis.Availability[] {
		let result: Redis.Availability[] = [];
		const numberOfNights: number = DateUtils.daysBetweenStartAndEndDates(
			new Date(searchOptions.startDate),
			new Date(searchOptions.endDate)
		);
		const destinations = cacheKeyValues.map((value) => ObjectUtils.smartParse(value) as Redis.Availability);
		const containsDestinationId: number[] = [];
		for (let destinationObj of destinations) {
			if (!ObjectUtils.isArrayWithData(destinationObj.accommodations)) continue;
			destinationObj.accommodations = destinationObj.accommodations.filter((accommodation) => {
				if (!!!accommodation.price.length) return;
				// Handle occupancy
				if (accommodation.maxSleeps < searchOptions.adultCount + searchOptions.childCount) return null;
				accommodation.price = accommodation.price.filter((price) => {
					// Handle Min/Max price
					if (!this.isValidSearchPriceRange(price, searchOptions)) return null;
					// Handle Quantity
					if (!!!price.qtyAvailable) return null;
					// Handle stay length
					if (price.minStay > 0 && numberOfNights < price.minStay) return null;
					if (price.maxStay > 0 && numberOfNights > price.maxStay) return null;
					return price;
				});
				if (!!accommodation.price.length) return accommodation;
			});
			if (!!!destinationObj.accommodations.length) {
				result = result.filter(
					(destinationObject) => destinationObject.destinationId !== destinationObj.destinationId
				);
				continue;
			}
			if (!containsDestinationId.includes(destinationObj.destinationId)) {
				containsDestinationId.push(destinationObj.destinationId);
				result.push(destinationObj);
			}
			const matchingDestination = result.find((d) => d.destinationId === destinationObj.destinationId);
			matchingDestination.accommodations = this.getConsistentAccommodations(
				matchingDestination.accommodations,
				destinationObj.accommodations
			);
		}
		return result;
	}

	private isValidSearchPriceRange(
		price: Redis.AvailabilityAccommodationPrice,
		searchOptions: Api.Destination.Req.Availability
	) {
		if (searchOptions.priceRangeMax && searchOptions.priceRangeMin) {
			return price.total >= searchOptions.priceRangeMin && price.total <= searchOptions.priceRangeMax;
		} else if (searchOptions.priceRangeMax) {
			return price.total <= searchOptions.priceRangeMax;
		} else if (searchOptions.priceRangeMin) {
			return price.total >= searchOptions.priceRangeMin;
		}
		return true;
	}

	private getConsistentAccommodations(
		filteredAccommodations: Redis.AvailabilityAccommodation[],
		nextAccommodations: Redis.AvailabilityAccommodation[]
	): Redis.AvailabilityAccommodation[] {
		const result: Redis.AvailabilityAccommodation[] = [];
		for (let accommodation of filteredAccommodations) {
			const matchingAccommodation = nextAccommodations.find((acc) => acc.id === accommodation.id);
			if (!!!matchingAccommodation) continue;
			accommodation.price = this.getConsistentPrices(accommodation.price, matchingAccommodation.price);
			if (!!accommodation.price.length) result.push(accommodation);
		}
		return result;
	}

	private getConsistentPrices(
		filteredPrices: Redis.AvailabilityAccommodationPrice[],
		nextPrices: Redis.AvailabilityAccommodationPrice[]
	): Redis.AvailabilityAccommodationPrice[] {
		return filteredPrices.filter((price) => nextPrices.some((p) => p.rate.code === price.rate.code));
	}
}
