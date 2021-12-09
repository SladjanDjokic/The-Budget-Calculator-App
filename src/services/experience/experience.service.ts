import { Service } from '../Service';
import { ServiceName } from '../serviceFactory';
import IMediaService from '../media/IMediaService';
import MediaService from '../media/media.service';
import { ObjectUtils } from '../../utils/utils';
import IExperienceTable from '../../database/interfaces/IExperienceTable';
import IDestinationExperienceTable from '../../database/interfaces/IDestinationExperienceTable';

export default class ExperienceService extends Service {
	mediaService: IMediaService;

	constructor(
		private readonly experienceTable: IExperienceTable,
		private readonly destinationExperienceTable: IDestinationExperienceTable
	) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.mediaService = services['MediaService'] as MediaService;
	}

	async createExperience(experience: Api.Experience.Req.Create): Promise<Api.Experience.Res.Create> {
		return this.experienceTable.create(experience);
	}

	async getAllExperiences(): Promise<Api.Experience.Res.Get[]> {
		return this.experienceTable.getAllExperiences();
	}

	async updateExperience(experience: Api.Experience.Req.Update): Promise<Api.Experience.Res.Update> {
		const id = experience.id;
		delete experience.id;
		return await this.experienceTable.update(id, experience);
	}

	async deleteExperience(id: number): Promise<number> {
		return await this.experienceTable.delete(id);
	}

	async createDestinationExperience({
		destinationId,
		experienceId,
		description,
		isHighlighted,
		media
	}: Api.Experience.Req.CreateDestinationExperience) {
		const createdObj: Model.DestinationExperience = await this.destinationExperienceTable.create({
			destinationId,
			experienceId,
			description,
			isHighlighted
		});
		await this.updateMediaMapAndSetMediaProperty(media, { destinationExperienceId: createdObj.id });
		return this.getDestinationExperienceById(createdObj.id);
	}

	async updateDestinationExperience({
		destinationExperienceId,
		destinationId,
		experienceId,
		description,
		isHighlighted,
		media
	}: Api.Experience.Req.UpdateDestinationExperience) {
		await this.destinationExperienceTable.update(destinationExperienceId, {
			destinationId,
			experienceId,
			description,
			isHighlighted
		});
		await this.updateMediaMapAndSetMediaProperty(media, { destinationExperienceId });
		return this.getDestinationExperienceById(destinationExperienceId);
	}

	getDestinationExperienceById(featureId: number): Promise<Model.DestinationExperience> {
		return this.destinationExperienceTable.getById(featureId);
	}

	deleteDestinationExperience(id: number): Promise<number> {
		return this.destinationExperienceTable.delete(id);
	}

	deleteManyDestinationExperiences(ids: number[]): Promise<number[]> {
		return this.destinationExperienceTable.deleteMany(ids);
	}

	private async updateMediaMapAndSetMediaProperty(
		featureMedia: Omit<Api.Media, 'urls' | 'companyId' | 'uploaderId' | 'type'>[],
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
			await this.mediaService.update(media.id, {
				isPrimary: media.isPrimary,
				title: media.title,
				description: media.description
			});
		}
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
