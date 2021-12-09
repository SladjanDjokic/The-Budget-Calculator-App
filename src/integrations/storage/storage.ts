import config from '../../utils/config';
import AwsS3 from './awsS3/AwsS3';
import IBulkDataStorage from './bulkDataStorage.interface';
import MockDataStorage from './mockDataStorage/MockDataStorage';
import logger from '../../utils/logger';
import { RsError } from '../../utils/errors';

class Storage {
	private readonly storage: IBulkDataStorage;
	private readonly mockStorage: IBulkDataStorage;
	private isUsingMockStorage = false;

	constructor() {
		this.mockStorage = new MockDataStorage();
		if (config.storage.hasOwnProperty('s3')) {
			this.storage = new AwsS3();
			this.storage.init(config.storage.s3).then((res) => {
				if (!res) throw new RsError('CONNECTION_ERROR', 'Could not communicate to AWS S3. Check credentials');
			});
		} else {
			logger.info('Using Mock Data Storage');
			this.isUsingMockStorage = true;
		}
	}

	get(): IBulkDataStorage {
		return this.isUsingMockStorage ? this.mockStorage : this.storage;
	}

	forceMock() {
		this.isUsingMockStorage = true;
	}

	restore() {
		this.isUsingMockStorage = false;
	}
}

const storage = new Storage();
export default storage;
