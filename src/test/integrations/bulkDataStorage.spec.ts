import chai from 'chai';
import storage from '../../integrations/storage/storage';
import config from '../../utils/config';
import path from 'path';

describe('Bulk Data Storage', function () {
	describe('Mock Data Storage', function () {
		after(() => {
			storage.restore();
		});

		it('should force mock data storage', async function () {
			storage.forceMock();
			chai.expect(storage.get().constructor.name).to.equal('MockDataStorage');
		});

		it('should fake upload a file', async function () {
			await storage.get().uploadFile(
				{
					bucketId: 'fake-id',
					destinationFilePath: 'some-path',
					mimeType: 'image/png'
				},
				'not-real-file'
			);
			chai.expect(storage.get()['fileUploadCount']).to.equal(1);
			chai.expect(storage.get()['lastUploadedFile']).to.equal('not-real-file');
		});
	});

	// Skip if we are not using S3, ignore interface if not in this project
	// @ts-ignore
	if (config.storage.s3) {
		describe('AWS S3 Storage', function () {
			it('should have loaded an AWS S3 storage engine', function () {
				chai.expect(storage.get().constructor.name).to.equal('AwsS3');
			});

			it('should upload a real file', async function () {
				let result = await storage.get().uploadFile(
					{
						bucketId: config.storage.defaultBucketId,
						destinationFilePath: 'storage-test-file.txt',
						mimeType: 'text/plain'
					},
					path.join(__dirname, '../resources/storage-test-file.txt')
				);
				chai.expect(result.url.length).to.be.greaterThan(0);
			});
		});
	}

	// Skip if we are not using backblaze, ignore interface if not in this project
	// @ts-ignore
	if (config.backblaze) {
		describe('Backblaze Storage', function () {
			it('should have loaded a backblaze storage engine', function () {
				chai.expect(storage['storage'].constructor.name).to.equal('Backblaze');
			});
		});
	}
});
