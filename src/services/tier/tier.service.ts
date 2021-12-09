import { Service } from '../Service';
import ITierTable from '../../database/interfaces/ITierTable';
import ITierFeatureTable from '../../database/interfaces/ITierFeatureTable';
import { ObjectUtils } from '../../utils/utils';
import IMediaService from '../media/IMediaService';
import MediaService from '../media/media.service';
import { ServiceName } from '../serviceFactory';

export interface TierToCreate extends Omit<Api.Tier.Req.Create, 'mediaDetails' | 'featureIds'> {}

export default class TierService extends Service {
	mediaService: IMediaService;
	constructor(private readonly tierTable: ITierTable, private readonly tierFeatureTable: ITierFeatureTable) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.mediaService = services['MediaService'] as MediaService;
	}

	getTierFields() {
		return this.tierTable.columns;
	}

	async create({ featureIds, mediaDetails, ...tierObj }: Api.Tier.Req.Create): Promise<Api.Tier.Res.Get> {
		const newTier: Model.Tier = await this.tierTable.create(tierObj);
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

	async update(tierId: number, tierUpdateObj: Api.Tier.Req.Update) {
		if (tierUpdateObj.featureIds) {
			await this.tierTable.deleteFeaturesForTier(tierId);
			await this.tierTable.addFeature(tierId, tierUpdateObj.featureIds);
			delete tierUpdateObj.featureIds;
		}
		return this.tierTable.update(tierId, tierUpdateObj);
	}

	updateFeature(tierFeatureId: number, tierFeatureObj: Partial<Model.TierFeature>) {
		return this.tierFeatureTable.update(tierFeatureId, tierFeatureObj);
	}

	delete(tierId: number) {
		return this.tierTable.delete(tierId);
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
