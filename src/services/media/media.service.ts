import { Service } from '../Service';
import path from 'path';
import sharp from 'sharp';
import config from '../../utils/config';
import MediaTable from '../../database/objects/media.db';
import MediaMapTable from '../../database/objects/mediaMap.db';
import dbSingleton from '../../database/dbSingleton';
import { RsError } from '../../utils/errors';
import storage from '../../integrations/storage/storage';
import logger from '../../utils/logger';
import { ObjectUtils } from '../../utils/utils';
import IMediaService from './IMediaService';

interface SingleImageType {
	id: number;
	type: 'USER' | 'COMPANY';
	wideLogoUrl?: boolean;
}

export interface ImageResizeParameters {
	pyramidSizeName: string;
	maxWidth: number;
	postfix: string;
}

export interface MediaCreate {
	companyId: number;
	uploaderId: number;
	type: 'image' | 'video' | 'imagePyramid';
	urls: Model.MediaUrls;
	storageDetails: Model.BackblazeStorageDetails[] | Model.S3StorageDetails[];
}

// ALWAYS keep this ordered largest to smallest. That way we resize in this order to keep highest quality
export const ImagePyramidSizes = {
	LARGE: 'large',
	MEDIUM: 'medium',
	MEDIUM_SMALL: 'mediumSmall',
	SMALL: 'small',
	SMALL_SMALL: 'smallSmall',
	THUMB: 'thumb'
};

export interface ImagePyramidUploadData {
	downloadUrls: { [key: string]: string };
	storageDetails: Model.BackblazeStorageDetails[] | Model.S3StorageDetails[];
}

export default class MediaService extends Service implements IMediaService {
	private mediaTable: MediaTable = dbSingleton.get().media;
	private mediaMapTable: MediaMapTable = dbSingleton.get().mediaMap;

	constructor() {
		super();
	}

	readonly imagePyramidDimensions: ImageResizeParameters[] = [
		{ pyramidSizeName: ImagePyramidSizes.LARGE, maxWidth: 1920, postfix: '_L' }
	];

	async generateImagePyramidUploadAndCreate(
		companyId: number,
		userId: number,
		path: string,
		keepTransparency: boolean
	): Promise<Model.Media> {
		const uploadedData: ImagePyramidUploadData = await this.generateImagePyramidAndUpload(path, keepTransparency);
		return await this.create({
			companyId: companyId,
			uploaderId: userId,
			type: 'imagePyramid',
			urls: {
				thumb: uploadedData.downloadUrls[ImagePyramidSizes.LARGE],
				small: uploadedData.downloadUrls[ImagePyramidSizes.LARGE],
				large: uploadedData.downloadUrls[ImagePyramidSizes.LARGE],
				imageKit: `${config.storage.imageKit.baseUrl}/${this.getFileName(
					uploadedData.downloadUrls[ImagePyramidSizes.LARGE]
				)}`
			},
			storageDetails: (uploadedData as ImagePyramidUploadData).storageDetails
		});
	}

	/**
	 * Creates a cascade of images each decreasing in size. Number of images is hard coded in imagePyramidDimensions
	 * @param originalImagePath - Image to resize
	 * @param keepTransparency - If image has transparency flag instructs whether to keep it or not.
	 * @param destinationFolder - Destination folder in storage bucket to save image sets
	 */
	async generateImagePyramidAndUpload(
		originalImagePath: string,
		keepTransparency: boolean,
		destinationFolder: string = 'images'
	): Promise<ImagePyramidUploadData> {
		let nextImagePath = originalImagePath;
		const { name } = path.parse(originalImagePath);
		let uploadData: ImagePyramidUploadData = { downloadUrls: {}, storageDetails: [] };

		for (let pyramidSize of this.imagePyramidDimensions) {
			let { resizedImagePath, mimeType, finalBaseFileName } = await this.resizeImage(
				nextImagePath,
				pyramidSize,
				keepTransparency,
				name
			);

			let uploadResponse = await storage.get().uploadFile(
				{
					bucketId: config.storage.defaultBucketId,
					destinationFilePath: destinationFolder + '/' + finalBaseFileName,
					mimeType: mimeType
				},
				resizedImagePath
			);

			uploadData.downloadUrls[pyramidSize.pyramidSizeName] = uploadResponse.url;
			uploadData.storageDetails.push({
				storageType: uploadResponse.storageType,
				fileId: uploadResponse.fileId,
				filePath: uploadResponse.filePath,
				bucketId: uploadResponse.bucketId
			});

			// It is more optimal to resize the previously resized image to the next smaller size
			// Thus we will use the resizedImagePath as the nextImagePath for resizing
			nextImagePath = resizedImagePath;
		}
		if (!uploadData || ObjectUtils.isEmptyObject(uploadData.downloadUrls)) {
			throw new RsError('UNKNOWN_ERROR', 'Error occurred generating and uploading images');
		}
		return uploadData;
	}

	create(obj: MediaCreate): Promise<Model.Media> {
		return this.mediaTable.create(obj);
	}

	async getById(id: number, companyId: number) {
		return await this.mediaTable.getById(id, companyId);
	}

	async getManyByIds(ids: number[], companyId: number) {
		return await this.mediaTable.getManyByIds(ids, companyId);
	}

	async delete(mediaId: number): Promise<number> {
		let result: Model.Media = await this.mediaTable.getById(mediaId);
		let storageDetails: Model.BackblazeStorageDetails[] | Model.S3StorageDetails[] = ObjectUtils.smartParse(
			result.storageDetails
		);
		for (let image of storageDetails) {
			await storage.get().deleteFile(image);
		}
		await this.mediaTable.delete(mediaId);
		return mediaId;
	}

	async uploadImageSingle(originalImagePath: string, mediaDetails: SingleImageType) {
		throw new RsError('BAD_REQUEST', 'Not implemented yet');
		// let id = mediaDetails.id;
		// let newUrlPath: string = '';
		// let nextImagePath = originalImagePath;
		// const { name } = path.parse(originalImagePath);
		// let resizedPath = await this.resizeSingleImage(nextImagePath, name, mediaDetails.wideLogoUrl);
		// let uploadResponse = await this.backblaze.uploadFile(resizedPath, 'images');
		// if ((uploadResponse as UploadFailureResult).err)
		// 	throw new RsError(BAD_REQUEST, 'Failed Uploading to Backblaze.');
		//
		// if ('downloadUrl' in uploadResponse) {
		// 	newUrlPath = uploadResponse.downloadUrl as string;
		// } else {
		// 	throw new RsError(BAD_REQUEST, 'Missing download url to update');
		// }
		//
		// if (mediaDetails.type === 'COMPANY') {
		// 	if (ObjectUtils.toBoolean(mediaDetails.wideLogoUrl)) {
		// 		let response: Model.Company = await this.companyService.update(id, { wideLogoUrl: newUrlPath });
		// 		if (!response) throw new RsError(BAD_REQUEST, 'Failed Updating COMPANY wideLogoUrl url');
		// 		return { newUrl: response.wideLogoUrl };
		// 	}
		// 	let response = await this.companyService.update(id, { logoUrl: newUrlPath });
		// 	if (!response) throw new RsError(BAD_REQUEST, 'Failed Updating COMPANY logo url');
		// 	return { newUrl: response.logoUrl };
		// } else {
		// 	throw new RsError(BAD_REQUEST, 'Missing or invalid type for single image Upload');
		// }
	}

	async getImageMapsByProductId(productId: number): Promise<any> {
		return await this.mediaMapTable.getImageMapsByProductId(productId);
	}

	async deleteImagesByProductId(productId: number) {
		await this.mediaMapTable.deleteImagesByProductId(productId);
	}

	async createMediaMapAndSetMediaProperty(
		mediaId: number,
		mediaMapKey: { [keyId: string]: number },
		mediaProperty: Partial<Model.Media>
	): Promise<boolean> {
		try {
			await this.createMediaMap(mediaId, mediaMapKey);
			await this.mediaTable.update(mediaId, mediaProperty);
			return true;
		} catch (e) {
			logger.error(e);
			return false;
		}
	}

	async updateMediaMapAndSetMediaProperty(
		featureMedia: Api.MediaDetails[],
		mediaMapKey: { [key: string]: number }
	): Promise<void> {
		const mediaMapKeys: Model.MediaMap[] = await this.getImageMapsByKeyId(mediaMapKey);
		const mediaIds: number[] = mediaMapKeys.map((map) => map.mediaId);
		const mediaToUpdate = featureMedia.filter((media) => {
			if (mediaIds.includes(media.id)) return media;
		});
		const mediaToCreate = featureMedia.filter((media) => {
			if (!mediaIds.includes(media.id)) return media;
		});
		for (let mediaItem of mediaToUpdate) {
			await this.update(mediaItem.id, { isPrimary: mediaItem.isPrimary });
		}
		if (!ObjectUtils.isArrayWithData(mediaToCreate)) return;
		for (let mediaItem of mediaToCreate) {
			await this.createMediaMapAndSetMediaProperty(mediaItem.id, mediaMapKey, {
				isPrimary: mediaItem.isPrimary
			});
		}
	}

	createMediaMap(mediaId: number, mapKey: { [keyId: string]: number }): Promise<boolean> {
		return this.mediaMapTable.create({ mediaId, ...mapKey });
	}

	getImageMapsByKeyId(mapKey: { [keyId: string]: number }) {
		return this.mediaMapTable.getByKeyId(mapKey);
	}

	update(mediaId: number, data: Partial<Model.Media>) {
		return this.mediaTable.update(mediaId, data);
	}

	getFileName(filePath: string): string {
		const { ext, name } = path.parse(filePath);
		return name + ext;
	}

	private async resizeImage(
		originalImagePath: string,
		imageResizeParameters: ImageResizeParameters,
		keepTransparency: boolean,
		baseFileName?: string
	): Promise<{ resizedImagePath: string; mimeType: string; finalBaseFileName: string }> {
		const { dir, ext, name } = path.parse(originalImagePath);
		let resizedImagePath = '';
		let finalBaseFileName = baseFileName
			? baseFileName + imageResizeParameters.postfix
			: name + imageResizeParameters.postfix;
		if (keepTransparency && ext.toLowerCase() === '.png') {
			finalBaseFileName += '.png';
			resizedImagePath = path.join(dir, finalBaseFileName);
			await sharp(originalImagePath)
				.resize({ width: imageResizeParameters.maxWidth })
				.png()
				.toFile(resizedImagePath);
			return { resizedImagePath: resizedImagePath, mimeType: 'image/png', finalBaseFileName };
		}

		finalBaseFileName += '.jpg';
		resizedImagePath = path.join(dir, finalBaseFileName);
		await sharp(originalImagePath)
			.flatten({ background: { r: 255, g: 255, b: 255 } })
			.resize({ width: imageResizeParameters.maxWidth })
			.jpeg({ progressive: true })
			.toFile(resizedImagePath);
		return { resizedImagePath, mimeType: 'image/jpeg', finalBaseFileName };
	}

	private async resizeSingleImage(originalImagePath: string, baseFileName?: string, isWideLogo?: boolean) {
		const { dir, ext, name } = path.parse(originalImagePath);
		let destinationFilePath = '';
		if (ext === '.png') {
			destinationFilePath = path.join(dir, name + 'singleImage' + '.png');
			if (isWideLogo) {
				await sharp(originalImagePath)
					.resize(1161, 373, { fit: 'cover', background: { r: 0, g: 0, b: 0, alpha: 0 } })
					.png()
					.toFile(destinationFilePath);
			} else {
				await sharp(originalImagePath)
					.resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
					.png()
					.toFile(destinationFilePath);
			}
		} else {
			destinationFilePath = path.join(dir, name + 'singleImage' + '.jpg');
			if (isWideLogo) {
				await sharp(originalImagePath)
					.resize(1161, 373, { fit: 'cover', background: { r: 255, g: 255, b: 255, alpha: 1 } })
					.jpeg({ progressive: true })
					.toFile(destinationFilePath);
			} else {
				await sharp(originalImagePath)
					.resize(200, 200, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
					.jpeg({ progressive: true })
					.toFile(destinationFilePath);
			}
		}
		return destinationFilePath;
	}

	private getForCompany(companyId: number): Promise<Model.Media[]> {
		return this.mediaTable.forCompany(companyId);
	}
}
