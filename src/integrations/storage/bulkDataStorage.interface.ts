export interface IDestinationInfo {
	mimeType: string;
	destinationFilePath: string;
	bucketId: string;
}

export interface IUploadSuccessResult {
	bucketId?: string;
	key?: string;
	fileId?: string;
	filePath: string;
	url: string;
	storageType: 's3' | 'backblaze';
}

export interface IStorageDetails {
	fileId?: string; // Needed by B2
	bucketId?: string; // Needed by S3
	filePath: string;
}

export default interface IBulkDataStorage {
	/**
	 * Initializes the connection using the given credentials
	 * since S3 and backblaze use different credentials we take any object and perform type guards
	 * to make sure it is correct
	 * @param credentials - Credentials for the system
	 */
	init(credentials: any): Promise<boolean>;

	/**
	 * Uploads a file from the local filesystem to the destination given
	 * @param destination - Destination location where to put the file
	 * @param localFilePath
	 * @throws RsError
	 */
	uploadFile(destination: IDestinationInfo, localFilePath: string): Promise<IUploadSuccessResult>;

	/**
	 * Deletes a file from the destination
	 * @param storageDetails
	 * @return returns true if deleted, file otherwise false
	 */
	deleteFile(storageDetails: IStorageDetails): Promise<boolean>;
}
