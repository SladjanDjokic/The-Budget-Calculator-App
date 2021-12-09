import IMediaService from './IMediaService';
import { ServiceName } from '../serviceFactory';
import { Service } from '../Service';

export default class MediaServiceMock implements IMediaService {
	createMediaMapAndSetMediaPropertyCalls: number = 0;

	constructor(public mediaIds: number[] = []) {}

	start(services: Partial<Record<ServiceName, Service>>) {}

	async createMediaMapAndSetMediaProperty(
		mediaId: number,
		mediaMapKey: { [keyId: string]: number },
		mediaProperty: Partial<Model.Media>
	): Promise<boolean> {
		this.createMediaMapAndSetMediaPropertyCalls++;
		this.mediaIds.push(mediaId);
		return true;
	}
	getCreateMediaMapAndSetMediaPropertyCalls() {
		return this.createMediaMapAndSetMediaPropertyCalls;
	}
	getMediaIds() {
		return this.mediaIds;
	}
	async updateMediaMapAndSetMediaProperty(
		mediaDetails: Api.MediaDetails[],
		mediaMapKey: { [key: string]: number }
	): Promise<void> {
		this.mediaIds = mediaDetails.map((detail) => detail.id);
	}

	getImageMapsByKeyId: (mapKey: { [keyId: string]: number }) => Promise<Model.MediaMap[]>;
	update: (mediaId: number, data: Partial<Model.Media>) => Promise<Model.Media>;
	deleteImagesByProductId: (productId: number) => Promise<void>;
}
