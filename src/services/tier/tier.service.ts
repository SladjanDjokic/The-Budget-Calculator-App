import { Service } from '../Service';
import ITierTable from '../../database/interfaces/ITierTable';
import ITierFeatureTable from '../../database/interfaces/ITierFeatureTable';
import { ObjectUtils } from '../../utils/utils';
import IMediaService from '../media/IMediaService';
import MediaService from '../media/media.service';
import { ServiceName } from '../serviceFactory';
import ITierMultiplierTable from '../../database/interfaces/ITierMultiplierTable';

export interface TierToCreate
	extends Pick<Model.Tier, 'name' | 'threshold'>,
		Pick<Partial<Model.Tier>, 'description' | 'isAnnualRate'> {}
export interface TierMultiplierToCreate
	extends Pick<Model.TierMultiplier, 'tierId' | 'multiplier' | 'creatingUserId'> {}

export default class TierService extends Service {
	mediaService: IMediaService;
	constructor(
		private readonly tierTable: ITierTable,
		private readonly tierFeatureTable: ITierFeatureTable,
		private readonly tierMultiplierTable: ITierMultiplierTable
	) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.mediaService = services['MediaService'] as MediaService;
	}

	getTierFields() {
		return this.tierTable.columns;
	}

	async create(
		{ featureIds, mediaDetails, accrualRate, ...tierObj }: Api.Tier.Req.Create,
		adminUserId: number
	): Promise<Api.Tier.Res.Get> {
		const newTier: Model.Tier = await this.tierTable.create(tierObj);
		await this.tierMultiplierTable.create({
			tierId: newTier.id,
			multiplier: accrualRate,
			creatingUserId: adminUserId
		});
		await this.tierTable.addFeature(newTier.id, featureIds);
		await this.createMediaMapAndSetMediaProperty(mediaDetails, { tierId: newTier.id });
		return this.tierTable.getById(newTier.id);
	}

	createFeature(featureName: string) {
		return this.tierFeatureTable.create({ name: featureName });
	}

	getById(tierId: number) {
		return this.tierTable.getById(tierId);
	}

	getByPage(pagination: RedSky.PagePagination, sort: RedSky.SortQuery, filter: RedSky.FilterQuery) {
		return this.tierTable.getByPage(pagination, sort, filter);
	}

	getFeatures() {
		return this.tierFeatureTable.getAll();
	}

	getFeature(featureId: number) {
		return this.tierFeatureTable.getById(featureId);
	}

	async update(
		tierId: number,
		{ accrualRate, ...tierUpdateObj }: Api.Tier.Req.Update,
		adminUserId: number
	): Promise<Api.Tier.Res.Get> {
		if (tierUpdateObj.featureIds) {
			await this.tierTable.deleteFeaturesForTier(tierId);
			await this.tierTable.addFeature(tierId, tierUpdateObj.featureIds);
			delete tierUpdateObj.featureIds;
		}
		await this.tierMultiplierTable.create({ tierId, multiplier: accrualRate, creatingUserId: adminUserId });
		return this.tierTable.update(tierId, tierUpdateObj);
	}

	updateFeature(tierFeatureId: number, tierFeatureObj: Partial<Model.TierFeature>) {
		return this.tierFeatureTable.update(tierFeatureId, tierFeatureObj);
	}

	async delete(tierId: number) {
		await this.tierTable.update(tierId, { isActive: 0 } as Partial<Model.Tier>);
		return tierId;
	}

	deleteFeature(tierFeatureId: number) {
		return this.tierFeatureTable.delete(tierFeatureId);
	}

	getAll() {
		return this.tierTable.getAll();
	}

	private async createMediaMapAndSetMediaProperty(
		rewardMedia: Api.MediaDetails[],
		mediaMapKey: { [key: string]: number }
	) {
		if (!ObjectUtils.isArrayWithData(rewardMedia)) return;
		for (let mediaItem of rewardMedia) {
			await this.mediaService.createMediaMapAndSetMediaProperty(mediaItem.id, mediaMapKey, {
				isPrimary: mediaItem.isPrimary
			});
		}
	}
}
