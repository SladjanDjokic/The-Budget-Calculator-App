import { Service } from '../Service';
import DestinationSystemProvider from '../../integrations/destinationSystem/destinationSystemProvider';
import DestinationService from '../destination/destination.service';
import { ServiceName } from '../serviceFactory';
import AccommodationLayout from '../../database/objects/accommodationLayout.db';
import MediaService from '../media/media.service';
import AccommodationLayoutRoom, { CreateLayoutRoom } from '../../database/objects/accommodationLayoutRoom.db';
import AccommodationCategory, {
	CreateAccommodationCategory,
	UpdateAccommodationCategory
} from '../../database/objects/accommodationCategory.db';
import { DateUtils, NumberUtils, ObjectUtils, RedisUtils } from '../../utils/utils';
import FeatureService from '../feature/feature.service';
import logger from '../../utils/logger';
import DestinationSystem from '../../integrations/destinationSystem/destinationSystem';
import { ServiceKeyAndDetails } from '../../database/interfaces/IServiceKeyTable';
import { IRedisClient } from '../../integrations/redis/IRedisClient';
import { RsError } from '../../utils/errors';
import IAccommodationTypeTable from '../../database/interfaces/IAccommodationTypeTable';
import IAccommodationTable from '../../database/interfaces/IAccommodationTable';
import CompanyService from '../company/company.service';
import UserPointService from '../userPoint/userPoint.service';
import { UserPointCreate } from '../userPoint/IUserPointService';
import Amenity from '../../database/objects/amenity.db';

export default class AccommodationService extends Service {
	destinationService: DestinationService;
	featureService: FeatureService;
	mediaService: MediaService;
	companyService: CompanyService;
	userPointService: UserPointService;

	constructor(
		private readonly destinationSystemProvider: DestinationSystemProvider,
		private readonly redisClient: IRedisClient,
		private readonly accommodationTable: IAccommodationTable,
		private readonly accommodationTypeTable: IAccommodationTypeTable,
		private readonly accommodationCategoryTable: AccommodationCategory,
		private readonly accommodationLayoutTable: AccommodationLayout,
		private readonly accommodationLayoutRoomTable: AccommodationLayoutRoom,
		private readonly amenityTable: Amenity
	) {
		super();
	}
	start(services: Partial<Record<ServiceName, Service>>) {
		this.destinationService = services['DestinationService'] as DestinationService;
		this.featureService = services['FeatureService'] as FeatureService;
		this.mediaService = services['MediaService'] as MediaService;
		this.companyService = services['CompanyService'] as CompanyService;
		this.userPointService = services['UserPointService'] as UserPointService;
	}

	async syncAndGetIntegrationAccommodationTypes(companyId: number) {
		let system: DestinationSystem;
		let companyDetails: ServiceKeyAndDetails;
		try {
			({ system, companyDetails } = await this.destinationSystemProvider.get(companyId));
		} catch {
			logger.warn('Unable to get destination system');
			return null;
		}
		const localDestinations: Model.Destination[] = await this.destinationService.getForCompany(companyId);
		const sabreDestinationList = [];
		for (let destination of localDestinations) {
			const result = await system.syncAccommodationTypes(companyDetails, destination);
			for (let res of result) {
				sabreDestinationList.push(res);
			}
		}
		return sabreDestinationList;
	}

	async syncAndGetIntegrationAccommodations(companyId: number) {
		let system: DestinationSystem;
		let companyDetails: ServiceKeyAndDetails;
		try {
			({ system, companyDetails } = await this.destinationSystemProvider.get(companyId));
		} catch {
			logger.warn('Unable to get destination system');
			return null;
		}
		return await system.syncAccommodationList(companyDetails, null);
	}

	async getAccommodationTypes(companyId: number): Promise<Model.AccommodationType[]> {
		return this.accommodationTypeTable.forCompany(companyId);
	}

	async getAccommodationTypesForDestination(
		destinationId: number,
		companyId: number
	): Promise<Model.AccommodationType[]> {
		return await this.accommodationTypeTable.getAllForDestination(destinationId, companyId);
	}

	async getAccommodationTypesForManyDestinations(
		destinationIds: number[],
		companyId: number
	): Promise<Model.AccommodationType[]> {
		return await this.accommodationTypeTable.getAllForManyDestinations(destinationIds, companyId);
	}

	async update(
		accommodationId: number,
		{ mediaIds, amenityIds, ...updateData }: Api.Accommodation.Req.Update,
		companyId: number
	): Promise<Api.Accommodation.Res.Details> {
		if (ObjectUtils.isArrayWithData(mediaIds)) {
			await this.updateMediaMapAndSetMediaProperty(mediaIds, { accommodationId });
		}
		if (ObjectUtils.isArrayWithData(amenityIds)) {
			await this.updateAmenities(accommodationId, amenityIds);
		}
		return await this.accommodationTable.update(accommodationId, updateData, companyId);
	}

	getById(accommodationId: number, companyId?: number): Promise<Api.Accommodation.Res.Details> {
		return this.accommodationTable.getAccommodationDetails(accommodationId, companyId);
	}

	getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Accommodation.Res.Details[]>> {
		return this.accommodationTable.getByPage(pagination, sort, filter, companyId);
	}

	async getAvailable(
		searchOptions: Api.Accommodation.Req.Availability,
		userId: number = 0,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Accommodation.Res.Availability[]>> {
		let keyDateRange: string[] = DateUtils.getDateRange(searchOptions.startDate, searchOptions.endDate);
		if (!!!keyDateRange?.length) return { data: [], total: 0 };
		const searchKeys = await RedisUtils.getDestinationSearchKeys(
			keyDateRange,
			this.redisClient,
			companyId,
			searchOptions.destinationId
		);
		if (!!!searchKeys?.length) return { data: [], total: 0 };
		const cacheKeyValues = await this.redisClient.getMany(searchKeys, false);
		if (!!!cacheKeyValues?.length) return { data: [], total: 0 };
		const availableDestination: Redis.Availability = this.filterQtyAndOptionalSearchAvailability(
			cacheKeyValues,
			searchOptions
		);
		if (!!!availableDestination) return { data: [], total: 0 };
		if (!ObjectUtils.isArrayWithData(availableDestination.accommodations)) {
			return { data: [], total: 0 };
		}
		const availableAccommodations = availableDestination.accommodations;
		const availableAccommodationIds: number[] = availableAccommodations.map((accommodation) => accommodation.id);
		let filtered: Api.Accommodation.Res.Availability[] = await this.accommodationTable.getAvailableByIds(
			availableAccommodationIds,
			searchOptions.propertyTypeIds,
			searchOptions.bedroomCount,
			searchOptions.bathroomCount
		);
		if (searchOptions.amenityIds) {
			filtered = filtered.filter((accommodation) => {
				return !!accommodation.amenities.find((amenity) => searchOptions.amenityIds.includes(amenity.id));
			});
		}
		let data = await this.finalizeAvailableAccommodations(filtered, availableAccommodations, userId);
		if (searchOptions.pagination) {
			data = ObjectUtils.paginateArray(data, searchOptions.pagination.page, searchOptions.pagination.perPage);
		}
		if (!!!data?.length) {
			logger.error('Pagination error', availableAccommodations, searchOptions.pagination);
			return { data: [], total: 0 };
		}
		data.sort(
			(accommodation1, accommodation2) => accommodation1.costPerNightCents - accommodation2.costPerNightCents
		);
		if (searchOptions.sortOrder === 'DESC') {
			data.reverse();
		}
		const total = data.length;
		return { data, total };
	}

	async createLayout(createLayoutDetails): Promise<Api.AccommodationLayout.Details> {
		const createdLayout: Api.AccommodationLayout.Details = await this.accommodationLayoutTable.create(
			createLayoutDetails
		);
		return await this.accommodationLayoutTable.getById(createdLayout.id, createdLayout.companyId);
	}

	async updateLayout(layoutDetails: Api.AccommodationLayout.Req.Update) {
		return await this.accommodationLayoutTable.update(layoutDetails.id, layoutDetails);
	}

	getLayoutById(layoutId: number, companyId?: number): Promise<Api.AccommodationLayout.Details> {
		return this.accommodationLayoutTable.getById(layoutId, companyId);
	}

	getManyLayouts(layoutIds: number[], companyId?: number): Promise<Api.AccommodationLayout.Details[]> {
		return this.accommodationLayoutTable.getManyByIds(layoutIds, companyId);
	}

	getLayoutByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<Api.AccommodationLayout.Res.GetByPage> {
		return this.accommodationLayoutTable.getByPage(pagination, sort, filter, companyId);
	}

	async deleteLayoutById(layoutId: number) {
		await this.accommodationLayoutTable.delete(layoutId);
		return layoutId;
	}

	createLayoutRoom(layoutRoomDetails: CreateLayoutRoom): Promise<Model.AccommodationLayoutRoom> {
		return this.accommodationLayoutRoomTable.create(layoutRoomDetails);
	}

	updateLayoutRoom(
		layoutRoomId: number,
		layoutRoomDetails: Api.AccommodationLayoutRoom.Req.Update
	): Promise<Model.AccommodationLayoutRoom> {
		return this.accommodationLayoutRoomTable.update(layoutRoomId, layoutRoomDetails);
	}

	getLayoutRoomById(layoutRoomId: number): Promise<Model.AccommodationLayoutRoom> {
		return this.accommodationLayoutRoomTable.getById(layoutRoomId);
	}

	getLayoutRoomsByLayoutId(layoutId: number): Promise<Model.AccommodationLayoutRoom[]> {
		return this.accommodationLayoutRoomTable.getByLayoutId(layoutId);
	}

	async deleteLayoutRoomById(layoutRoomId: number): Promise<number> {
		await this.accommodationLayoutRoomTable.delete(layoutRoomId);
		return layoutRoomId;
	}

	async createCategory({ mediaIds, features, ...categoryDetails }: CreateAccommodationCategory) {
		const createdCategory: Api.AccommodationCategory.Details = await this.accommodationCategoryTable.create(
			categoryDetails
		);
		if (ObjectUtils.isArrayWithData(mediaIds)) {
			for (let mediaItem of mediaIds) {
				await this.createMediaMapAndSetMediaProperties(
					{ accommodationCategoryId: createdCategory.id },
					mediaItem.id,
					{ isPrimary: mediaItem.isPrimary }
				);
			}
		}
		if (ObjectUtils.isArrayWithData(features)) {
			for (let featureId of features) {
				await this.featureService.update(featureId, {
					id: featureId,
					accommodationCategoryId: createdCategory.id,
					companyId: createdCategory.companyId
				});
			}
		}
		return await this.accommodationCategoryTable.getById(createdCategory.id);
	}

	getCategoryById(categoryId: number, companyId?: number): Promise<Api.AccommodationCategory.Details> {
		return this.accommodationCategoryTable.getById(categoryId, companyId);
	}

	getManyCategoriesByIds(categoryIds: number[], companyId?: number): Promise<Api.AccommodationCategory.Details[]> {
		return this.accommodationCategoryTable.getManyByIds(categoryIds, companyId);
	}

	getCategoryForAccommodation(accommodationId: number) {
		return this.accommodationCategoryTable.getForAccommodation(accommodationId);
	}

	getCategoryForDestination(destinationId: number) {
		return this.accommodationCategoryTable.getForDestination(destinationId);
	}

	async updateCategory(
		accommodationCategoryId: number,
		{ mediaIds, ...accommodationCategoryDetails }: UpdateAccommodationCategory
	): Promise<Api.AccommodationCategory.Details> {
		if (ObjectUtils.isArrayWithData(mediaIds)) {
			await this.updateMediaMapAndSetMediaProperty(mediaIds, { accommodationCategoryId });
		}
		return await this.accommodationCategoryTable.update(accommodationCategoryId, accommodationCategoryDetails);
	}

	async deleteCategory(accommodationCategoryId: number, companyId: number): Promise<number> {
		await this.accommodationCategoryTable.delete(accommodationCategoryId, companyId);
		return accommodationCategoryId;
	}

	async createAmenity(amenity: Api.Amenity.Req.Create): Promise<Api.Amenity.Res.Create> {
		return this.amenityTable.create(amenity);
	}

	async getAllAmenities(): Promise<Api.Amenity.Res.Get[]> {
		return this.amenityTable.getAllAmenities();
	}

	async updateAmenity(amenity: Api.Amenity.Req.Update): Promise<Api.Amenity.Res.Update> {
		const id = amenity.id;
		delete amenity.id;
		return this.amenityTable.update(id, amenity);
	}

	async deleteAmenity(id: number): Promise<number> {
		return this.amenityTable.delete(id);
	}

	private async createMediaMapAndSetMediaProperties(
		mediaMapKey: { [key: string]: number },
		mediaId: number,
		mediaProperties?: Partial<Model.Media>
	): Promise<boolean> {
		return await this.mediaService.createMediaMapAndSetMediaProperty(mediaId, mediaMapKey, mediaProperties);
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

	private async updateAmenities(accommodationId: number, amenityIds: number[]) {
		await this.amenityTable.deleteForAccommodation(accommodationId);
		await this.amenityTable.createAccommodationMapping(accommodationId, amenityIds);
	}

	private async finalizeAvailableAccommodations(
		accommodations: Api.Accommodation.Res.Availability[],
		paginatedCacheList: Redis.AvailabilityAccommodation[],
		userId: number
	): Promise<Api.Accommodation.Res.Availability[]> {
		const updatedAccommodations = [];
		for (let accommodation of accommodations) {
			const cacheAccommodation = paginatedCacheList.find((a) => a.id === accommodation.id);
			if (!!!cacheAccommodation) continue;
			const bestPrice = RedisUtils.getLowestPrice(cacheAccommodation.price);
			if (!!!bestPrice?.qtyAvailable) continue;
			const redemptionRatio = await this.companyService.getRedemptionPointRatio();
			const pointsPerNight = NumberUtils.centsToPoints(bestPrice.total, redemptionRatio);
			const pointObj: UserPointCreate = {
				pointAmount: bestPrice.total,
				userId: userId,
				status: 'PENDING', // put in as pending until we figure out how to get confirmation of successful stay (We don't want users to get and use points then cancel) But we need to figure out how we get notified of an actual stay
				pointType: 'BOOKING',
				reason: 'HOTEL_STAY'
			};
			let pointsEarned = await this.userPointService.calculateMultiplier(pointObj);
			updatedAccommodations.push({
				...accommodation,
				costPerNightCents: bestPrice.total,
				availableRoomCount: bestPrice.qtyAvailable,
				// this is just a placeholder until we figure out the point earned translation stuff
				pointsPerNight,
				pointsEarned
			});
		}
		return updatedAccommodations;
	}

	private filterQtyAndOptionalSearchAvailability(
		cacheKeyValues: string[],
		searchOptions: Api.Accommodation.Req.Availability
	): Redis.Availability {
		const result: Redis.Availability[] = [];
		const numberOfNights: number = DateUtils.daysBetweenStartAndEndDates(
			new Date(searchOptions.startDate),
			new Date(searchOptions.endDate)
		);
		const destinations = cacheKeyValues.map((value) => ObjectUtils.smartParse(value) as Redis.Availability);
		const containsDestinationId: number[] = [];
		for (let destinationObj of destinations) {
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
			if (!!!destinationObj.accommodations.length) continue;
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
		if (ObjectUtils.isArrayWithData(result) && result.length > 1) {
			logger.error(
				`ERROR - Found too many destinations on accommodation.filterQtyAndOptionSearchAvailability`,
				result
			);
			throw new RsError(
				'DUPLICATE',
				'Found too many destinations on accommodation.filterQtyAndOptionSearchAvailability'
			);
		}
		return result[0];
	}

	private isValidSearchPriceRange(
		price: Redis.AvailabilityAccommodationPrice,
		searchOptions: Api.Accommodation.Req.Availability
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

	// This method is only used in testing
	private accommodationLayoutsForCompany(companyId: number): Promise<Api.AccommodationLayout.Details[]> {
		return this.accommodationLayoutTable.getForCompanyId(companyId);
	}
}
