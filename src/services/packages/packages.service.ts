import { Service } from '../Service';
import { DateUtils, ObjectUtils, RedisUtils } from '../../utils/utils';
import IUpsellPackageTable from '../../database/interfaces/IUpsellPackageTable';
import IMediaService from '../media/IMediaService';
import { IRedisClient } from '../../integrations/redis/IRedisClient';
import logger from '../../utils/logger';
import ReservationSystemProvider from '../../integrations/reservationSystem/reservationSystemProvider';
import ReservationSystem from '../../integrations/reservationSystem/reservationSystem.class';
import { IReservationSystem } from '../../integrations/reservationSystem/reservationSystem.interface';
import { ServiceName } from '../serviceFactory';
import MediaService from '../media/media.service';

export interface UpsellPackageCacheBlock {
	[key: string]: Redis.UpsellPackageAvailability;
}
export default class UpsellPackageService extends Service {
	mediaService: IMediaService;
	constructor(
		private readonly upsellPackageTable: IUpsellPackageTable,
		private readonly redisClient: IRedisClient,
		private readonly reservationSystemProvider: ReservationSystemProvider
	) {
		super();
	}
	start(services: Partial<Record<ServiceName, Service>>) {
		this.mediaService = services['MediaService'] as MediaService;
	}

	async update(
		{ id: packageId, mediaIds, ...packageDetails }: Api.UpsellPackage.Req.Update,
		companyId: number
	): Promise<Api.UpsellPackage.Details> {
		if (mediaIds) await this.updateMediaMapAndSetMediaProperty(mediaIds, { packageId });
		return await this.upsellPackageTable.update(packageId, packageDetails, companyId);
	}

	getById(packageId: number, companyId?: number): Promise<Api.UpsellPackage.Details> {
		return this.upsellPackageTable.getById(packageId, companyId);
	}

	getManyByIds(packageIds: number[], companyId?: number): Promise<Api.UpsellPackage.Details[]> {
		return this.upsellPackageTable.getManyByIds(packageIds, companyId);
	}

	getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.UpsellPackage.Details[]>> {
		return this.upsellPackageTable.getByPage(pagination, sort, filter, companyId);
	}

	async getAvailable(
		searchOptions: Api.UpsellPackage.Req.Availability,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.UpsellPackage.Res.Complete[]>> {
		let keyDateRange: string[] = DateUtils.getDateRange(searchOptions.startDate, searchOptions.endDate);
		if (!!!keyDateRange?.length) return { data: [], total: 0 };
		let searchKeys = keyDateRange.map((keyDate) =>
			RedisUtils.generateUpsellPackageIndexKey(searchOptions.destinationId, keyDate)
		);
		const cacheValues = await this.redisClient.getMany(searchKeys);
		if (!!!cacheValues?.length) return { data: [], total: 0 };
		const availablecachedUpsellPackages = UpsellPackageService.filterAvailable(cacheValues, searchOptions);
		const total = availablecachedUpsellPackages.length;
		if (!!!total) return { data: [], total };
		const paginatedUpsellPackages = ObjectUtils.paginateArray(
			availablecachedUpsellPackages,
			searchOptions.pagination.page,
			searchOptions.pagination.perPage
		);
		if (!!!paginatedUpsellPackages?.length) {
			logger.error('Pagination error', availablecachedUpsellPackages, searchOptions.pagination);
			return { data: [], total };
		}
		const availableIds = paginatedUpsellPackages.map((up) => up.id);
		const localUpsellPackages = await this.upsellPackageTable.getManyByIds(availableIds, companyId);
		const data: Api.UpsellPackage.Res.Complete[] = UpsellPackageService.finalizeAvailableUpsellPackages(
			localUpsellPackages,
			paginatedUpsellPackages
		);

		return { data, total };
	}
	static finalizeAvailableUpsellPackages(
		localUpsellPackages: Api.UpsellPackage.Details[],
		cachedUpsellPackages: Redis.AvailableUpsellPackage[]
	): Api.UpsellPackage.Res.Complete[] {
		const output: Api.UpsellPackage.Res.Complete[] = [];
		for (const local of localUpsellPackages) {
			const cached = cachedUpsellPackages.find((up) => up.id === local.id);
			if (!!!cached) continue;
			output.push({
				...local,
				priceDetail: cached.priceDetail
			});
		}
		return output;
	}

	async writeAvailabilityToCache(result: UpsellPackageCacheBlock) {
		for (let i in result) {
			const resultData = result[i];
			await this.redisClient.set(i, resultData);
		}
	}

	async syncPackageBlock(companyId: number, reservationBlock: string): Promise<UpsellPackageCacheBlock> {
		const { system, companyDetails } = await this.reservationSystemProvider.get(companyId);
		let { destinationId, month, year, daysInMonth } = RedisUtils.getValidBlockInfo(reservationBlock);
		const upsellPackageAvailability: UpsellPackageCacheBlock = await system.getUpsellPackagesForBlock(
			companyDetails,
			destinationId,
			month,
			year,
			daysInMonth
		);
		await this.writeAvailabilityToCache(upsellPackageAvailability);
		return upsellPackageAvailability;
	}

	async getRefreshKeys(companyId: number) {
		let system: ReservationSystem;
		try {
			({ system } = await this.reservationSystemProvider.get(companyId));
		} catch {
			logger.error(`Unable to get reservation system for ${companyId}`);
			return null;
		}
		return system.getUpsellPackageRefreshKeys();
	}

	async updateRefreshKeys(companyId: number, keySet: IReservationSystem.RefreshKeySet) {
		let system: ReservationSystem;
		try {
			({ system } = await this.reservationSystemProvider.get(companyId));
		} catch {
			logger.error(`Unable to get reservation system for ${companyId}`);
			return;
		}
		system.updateAllUpsellPackageRefreshKeys(keySet);
	}

	private async createMediaMapAndSetMediaProperty(
		packageMedia: Api.MediaDetails[],
		mediaMapKey: { [key: string]: number }
	) {
		for (let mediaItem of packageMedia) {
			await this.mediaService.createMediaMapAndSetMediaProperty(mediaItem.id, mediaMapKey, {
				isPrimary: mediaItem.isPrimary
			});
		}
	}

	private async updateMediaMapAndSetMediaProperty(
		packageMedia: Api.MediaDetails[],
		mediaMapKey: { [key: string]: number }
	) {
		const mediaMapKeys: Model.MediaMap[] = await this.mediaService.getImageMapsByKeyId(mediaMapKey);
		const mediaIds: number[] = mediaMapKeys.map((media) => {
			return media.mediaId;
		});
		const mediaToUpdate = packageMedia.filter((media) => {
			if (mediaIds.includes(media.id)) return media;
		});
		const mediaToCreate = packageMedia.filter((media) => {
			if (!mediaIds.includes(media.id)) return media;
		});
		if (ObjectUtils.isArrayWithData(mediaToCreate))
			await this.createMediaMapAndSetMediaProperty(mediaToCreate, mediaMapKey);
		for (let media of mediaToUpdate) {
			await this.mediaService.update(media.id, { isPrimary: media.isPrimary });
		}
	}

	private static filterAvailable(
		cacheValues: string[],
		searchOptions: Api.UpsellPackage.Req.Availability
	): Redis.AvailableUpsellPackage[] {
		const days: Redis.UpsellPackageAvailability[] = cacheValues.map(ObjectUtils.smartParse);
		if (!!searchOptions.packageIds?.length) {
			days.forEach((d) =>
				ObjectUtils.pruneInPlace(d.upsellPackages, (p) => searchOptions.packageIds.includes(p.id))
			);
		}
		if (!!searchOptions.excludePackageIds?.length) {
			days.forEach((d) =>
				ObjectUtils.pruneInPlace(d.upsellPackages, (p) => !searchOptions.excludePackageIds.includes(p.id))
			);
		}
		return days[0].upsellPackages?.filter((up) => up.pricingType === 'PerStay') || [];
		// This will expand as we implement support for more pricing models
	}
}
