import B2 from 'backblaze-b2';
import fs from 'fs';
import path from 'path';
const MAX_UPLOAD_RETRIES = 5;
import logger from '../../utils/logger';

export interface BackblazeConfig {
	bucketId: string;
	accountId: string;
	applicationKey: string;
}

export interface UploadSuccessResult {
	downloadUrl: string;
	fileId: string;
	filePath: string;
}

export interface UploadFailureResult {
	err: 'B2_UPLOAD_FAILED';
	msg: string;
}

export interface FileInfo {
	accountId: string;
	action: string;
	bucketId: string;
	contentLength: number;
	contentMd5: string;
	contentSha1: string;
	contentType: string;
	fileId: string;
	fileInfo: any;
	fileName: string;
	uploadTimestamp: number;
}

// TODO: This interface needs to be confirmed
export interface BucketInfo {
	accountId: string; //The account that the bucket is in.
	bucketId: string; // The unique ID of the bucket.
	bucketName: string; // The unique name of the bucket
	bucketType: 'allPublic' | 'allPrivate' | 'snapshot'; //One of: "allPublic", "allPrivate", "snapshot", or other values added in the future. "allPublic" means that anybody can download the files is the bucket; "allPrivate" means that you need an authorization token to download them; "snapshot" means that it's a private bucket containing snapshots created on the B2 web site.
	bucketInfo: any; // The user data stored with this bucket.
	corsRules: any; // The CORS rules for this bucket. See CORS Rules for an overview and the rule structure.
	lifecycleRules: any; // The list of lifecycle rules for this bucket. See Lifecycle Rules for an overview and the rule structure.
	revision: number; // A counter that is updated every time the bucket is modified, and can be used with the ifRevisionIs parameter to b2_update_bucket to prevent colliding, simultaneous updates.
	options: any;
}

interface StandardB2ApiResponse {
	status: string;
	statusText: string;
	headers: any;
	config: any;
	request: any;
	data: any;
}

export default class Backblaze {
	private config: BackblazeConfig;

	// Authorizations are only valid for 24 hours. Thus we will try to authorize before any operations
	private lastAuthorizationResponse: any = {}; // Authorizations are only valid for 24 hours. Thus we will try to authorize before any operations
	private b2: B2;

	constructor(config: BackblazeConfig) {
		this.config = config;
		this.b2 = new B2({
			applicationKeyId: this.config.accountId,
			applicationKey: this.config.applicationKey
		});
	}

	async uploadFile(
		fileNamePath: string,
		destinationFolder: string,
		progressCallback?: (event: any) => void
	): Promise<UploadSuccessResult | UploadFailureResult> {
		// Backblaze will often return a 500 error code (by design) in order for you to upload to a different vault.
		// Catch 500 errors and allow a certain number of retries to get the data fully uploaded. See this article here:
		// https://www.backblaze.com/blog/b2-503-500-server-error/

		let lastFailureCatchError: UploadFailureResult;

		let name = path.basename(fileNamePath);
		let startTime = Date.now();
		let bucketInfo: BucketInfo | null = null;
		let uploadResult: StandardB2ApiResponse;

		let retries;
		for (retries = 0; retries < MAX_UPLOAD_RETRIES; retries++) {
			// On the first go around don't try to re-authorize. Saves time
			if (retries > 0 && (await this.authorizeBackblaze()) === false) {
				lastFailureCatchError = this.createErrorObject(
					'B2_UPLOAD_FAILED',
					'Could not authorize with Backblaze.'
				);
				await this.sleep(500);
				continue;
			}

			try {
				destinationFolder = path.normalize(destinationFolder + '/').replace(/\\/g, '/');
				let urlResponse = await this.b2.getUploadUrl({ bucketId: this.config.bucketId });
				bucketInfo = await this.getBucketInfo(this.config.bucketId);
				if (!bucketInfo) {
					lastFailureCatchError = this.createErrorObject('B2_UPLOAD_FAILED', 'Could not find bucket info');
					continue;
				}
				let fileBuff = fs.readFileSync(fileNamePath);

				logger.info('Uploading to Backblaze: ' + destinationFolder + name);

				uploadResult = await this.b2.uploadFile({
					uploadUrl: urlResponse.data.uploadUrl,
					uploadAuthToken: urlResponse.data.authorizationToken,
					fileName: destinationFolder + name,
					mime: '', // optional mime type, will default to 'b2/x-auto' if not provided
					data: fileBuff, // this is expecting a Buffer, not an encoded string
					info: {},
					onUploadProgress: function (event) {
						if (progressCallback) progressCallback(event);
					}
				});

				// If we don't throw then we successfully completed - break out of retry loop
				break;
			} catch (e) {
				logger.info('Failed uploading to backblaze with error:', e);
				if (e.response && e.response.data)
					logger.info(
						`Backblaze Status : ${e.response.status}: ${e.response.data.code} - ${e.response.data.message}`
					);
				lastFailureCatchError = this.createErrorObject('B2_UPLOAD_FAILED', e);
				await this.sleep(2000);
			}
		}

		if (retries == MAX_UPLOAD_RETRIES) {
			logger.error('Completely failed uploading to backblaze.');
			return lastFailureCatchError;
		}

		logger.info(
			`Completed Upload to Backblaze: ${uploadResult.data.fileName} in ${(Date.now() - startTime) / 1000} seconds`
		);
		return {
			downloadUrl: `${this.lastAuthorizationResponse.downloadUrl}/file/${bucketInfo.bucketName}/${uploadResult.data.fileName}`,
			fileId: uploadResult.data.fileId,
			filePath: uploadResult.data.fileName
		};
	}

	async getFileInfo(fileId: string): Promise<FileInfo | null> {
		if ((await this.authorizeBackblaze()) === false) return null;
		try {
			let res = await this.b2.getFileInfo({ fileId: fileId });
			if (res.data) return res.data;
		} catch (e) {}
		return null;
	}

	async deleteFile(backblazeFileId: string, fileName: string): Promise<boolean> {
		if ((await this.authorizeBackblaze()) === false) return false;
		try {
			await this.b2.deleteFileVersion({
				fileId: backblazeFileId,
				fileName: fileName
			});
			logger.info(`File Deleted From Backblaze: ${fileName}`);
			return true;
		} catch (e) {
			return false;
		}
	}

	async getBucketInfo(bucketId: string): Promise<BucketInfo | null> {
		if ((await this.authorizeBackblaze()) === false) return null;
		let res = await this.b2.listBuckets();
		let bucketArray = res.data.buckets as BucketInfo[];
		for (let i in bucketArray) {
			if (bucketArray[i].bucketId === bucketId) return bucketArray[i];
		}

		return null;
	}

	private async authorizeBackblaze(): Promise<boolean> {
		try {
			this.lastAuthorizationResponse = await this.b2.authorize();
			this.lastAuthorizationResponse = this.lastAuthorizationResponse.data; // Strip off data field
			return true;
		} catch (e) {
			logger.error('Error authorizing Backblaze: ' + e.message);
			return false;
		}
	}

	private createErrorObject(errorName, errorMessage): UploadFailureResult {
		return {
			err: errorName,
			msg: errorMessage
		};
	}

	private sleep(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}
}
