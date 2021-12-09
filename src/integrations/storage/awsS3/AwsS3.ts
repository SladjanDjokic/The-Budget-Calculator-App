import IBulkDataStorage, {
	IDestinationInfo,
	IStorageDetails,
	IUploadSuccessResult
} from '../bulkDataStorage.interface';
import Aws from 'aws-sdk';
import fs from 'fs';
import { ManagedUpload } from 'aws-sdk/lib/s3/managed_upload';
import SendData = ManagedUpload.SendData;
import { ObjectUtils } from '../../../utils/utils';
import { RsError } from '../../../utils/errors';

interface AwsS3Credentials {
	region: string;
	accessKeyId: string;
	secretAccessKey: string;
}

export default class AwsS3 implements IBulkDataStorage {
	s3: Aws.S3;

	init(credentials: any): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			if (!this.isAwsS3Credentials(credentials)) {
				resolve(false);
				return;
			}

			// Set the region
			Aws.config.update({ region: credentials.region });
			this.s3 = new Aws.S3({
				accessKeyId: credentials.accessKeyId,
				secretAccessKey: credentials.secretAccessKey
			});

			this.s3.listBuckets((err) => {
				if (err) {
					resolve(false);
					return;
				}
				resolve(true);
			});
		});
	}

	uploadFile(destination: IDestinationInfo, localFilePath: string): Promise<IUploadSuccessResult> {
		return new Promise<IUploadSuccessResult>(async (resolve) => {
			const fileContent = await fs.promises.readFile(localFilePath);

			// Setting up S3 upload parameters
			const params: Aws.S3.PutObjectRequest = {
				Bucket: destination.bucketId,
				Key: destination.destinationFilePath, // File name you want to save as in S3
				ContentType: destination.mimeType,
				Body: fileContent
			};

			// Uploading files to the bucket
			this.s3.upload(params, function (err, data: SendData) {
				if (err) throw new RsError('INTEGRATION_ERROR', err.message);

				resolve({ bucketId: destination.bucketId, filePath: data.Key, url: data.Location, storageType: 's3' });
			});
		});
	}

	deleteFile(storageDetails: IStorageDetails): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			const params: Aws.S3.DeleteObjectRequest = {
				Bucket: storageDetails.bucketId,
				Key: storageDetails.filePath
			};

			// Uploading files to the bucket
			this.s3.deleteObject(params, function (err, data) {
				if (err) {
					resolve(false);
				}

				resolve(true);
			});
		});
	}

	private isAwsS3Credentials(credentials: any): credentials is AwsS3Credentials {
		return (
			ObjectUtils.isObject(credentials) &&
			'region' in credentials &&
			'accessKeyId' in credentials &&
			'secretAccessKey' in credentials
		);
	}
}
