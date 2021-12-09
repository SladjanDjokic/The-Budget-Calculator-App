import IService from '../IService';

export default interface IMediaService extends IService {
	getImageMapsByKeyId: (mapKey: { [keyId: string]: number }) => Promise<Model.MediaMap[]>;
	update: (mediaId: number, data: Partial<Model.Media>) => Promise<Model.Media>;
	createMediaMapAndSetMediaProperty: (
		mediaId: number,
		mediaMapKey: { [keyId: string]: number },
		mediaProperty: Partial<Model.Media>
	) => Promise<boolean>;
	updateMediaMapAndSetMediaProperty: (
		featureMedia: Api.MediaDetails[],
		mediaMapKey: { [key: string]: number }
	) => Promise<void>;
}
