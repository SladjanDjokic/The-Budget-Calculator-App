import IBulkDataStorage, {
	IDestinationInfo,
	IStorageDetails,
	IUploadSuccessResult
} from '../bulkDataStorage.interface';
import logger from '../../../utils/logger';

export default class MockDataStorage implements IBulkDataStorage {
	private fileUploadCount = 0;
	private lastUploadedFile = '';

	async init(credentials: any) {
		return true;
	}

	async uploadFile(destination: IDestinationInfo, localFilePath: string): Promise<IUploadSuccessResult> {
		logger.info('Mock: Uploading file: ' + localFilePath);
		this.fileUploadCount++;
		this.lastUploadedFile = localFilePath;
		return {
			storageType: 'backblaze',
			filePath: 'image/fakeImage.png',
			url: 'https://www.nickcage.com'
		};
	}

	private resetMockData() {
		this.lastUploadedFile = '';
		this.fileUploadCount = 0;
	}

	deleteFile(storageDetails: IStorageDetails): Promise<boolean> {
		return Promise.resolve(false);
	}
}
