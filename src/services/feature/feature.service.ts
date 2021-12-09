import { Service } from '../Service';
import FeatureTable, { FeatureCreate } from '../../database/objects/feature.db';
import { ObjectUtils } from '../../utils/utils';
import { RsError } from '../../utils/errors';
import IMediaService from '../media/IMediaService';
import { ServiceName } from '../serviceFactory';
import MediaService from '../media/media.service';

export interface FeatureUpdate extends Api.Feature.Req.Update {
	companyId?: number;
	accommodationCategoryId?: number;
	destinationId?: number;
	accommodationId?: number;
	brandId?: number;
}

export default class FeatureService extends Service {
	mediaService: IMediaService;
	constructor(private readonly featureTable: FeatureTable) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.mediaService = services['MediaService'] as MediaService;
	}

	async create({ mediaIds, ...featureDetails }: FeatureCreate): Promise<Api.Feature.Details> {
		const createdFeature: Api.Feature.Details = await this.featureTable.create(featureDetails);
		await this.createMediaMapAndSetMediaProperty(mediaIds, { featureId: createdFeature.id });
		return this.getById(createdFeature.id);
	}

	async update(featureId: number, { mediaIds, ...featureDetails }: FeatureUpdate): Promise<Api.Feature.Details> {
		if (mediaIds) await this.mediaService.updateMediaMapAndSetMediaProperty(mediaIds, { featureId });
		return await this.featureTable.update(featureId, featureDetails);
	}

	getById(featureId: number): Promise<Api.Feature.Details> {
		return this.featureTable.getById(featureId);
	}

	getManyByIds(featureIds: number[]): Promise<Api.Feature.Details[]> {
		return this.featureTable.getManyByIds(featureIds);
	}

	getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Feature.Details[]>> {
		return this.featureTable.getByPage(pagination, sort, filter, companyId);
	}

	async delete(companyId: number, featureId: number): Promise<number> {
		if (!(await this.isInCompany(companyId, [featureId])))
			throw new RsError('FORBIDDEN', 'Unauthorized delete attempt');
		const deletedFeature: number = await this.featureTable.delete(featureId);
		if (!deletedFeature) throw new RsError('BAD_REQUEST', 'Failed to delete');
		return deletedFeature;
	}

	async deleteMany(companyId: number, featureIds: number[]): Promise<number[]> {
		if (!(await this.isInCompany(companyId, featureIds)))
			throw new RsError('FORBIDDEN', 'Unauthorized delete attempt');
		const deleted: { deleted: number } = await this.featureTable.deleteMany(featureIds);
		if (deleted.deleted !== featureIds.length) throw new RsError('BAD_REQUEST', 'Failed to delete');
		return featureIds;
	}

	private async isInCompany(companyId: number, featureIds: number[]): Promise<boolean> {
		return await this.featureTable.isInCompany(companyId, featureIds);
	}

	private async createMediaMapAndSetMediaProperty(
		featureMedia: Api.MediaDetails[],
		mediaMapKey: { [key: string]: number }
	) {
		if (!ObjectUtils.isArrayWithData(featureMedia)) return;
		for (let mediaItem of featureMedia) {
			await this.mediaService.createMediaMapAndSetMediaProperty(mediaItem.id, mediaMapKey, {
				isPrimary: mediaItem.isPrimary
			});
		}
	}
}
