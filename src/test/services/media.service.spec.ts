import MediaService, { ImagePyramidUploadData, ImagePyramidSizes } from '../../services/media/media.service';
import fs from 'fs';
import path from 'path';

// Copy resource file to the temp folder where images are normally uploaded to
import chai from 'chai';
import { tempFolderPath } from '../../utils/tempStorageHandler';

// import { ImportMock } from 'ts-mock-imports';
import * as backBlazeMocks from '../../integrations/backblaze/backblaze';
// import * as awsS3Mocks from '../../integrations/storage/awsS3/AwsS3';
import dbSingleton from '../../database/dbSingleton';
import { WebUtils } from '../../utils/utils';
import BackblazeStorageDetails = Model.BackblazeStorageDetails;
import serviceFactory from '../../services/serviceFactory';
import config from '../../utils/config';

// Import BackBlaze and stub the uploadFile Function
// const mockManager = ImportMock.mockClass(awsS3Mocks, 'default');
// mockManager.mock('uploadFile', { downloadUrl: 'fakeUrl', fileId: 'fakeId', filePath: 'fakeName' });

const mediaTestUrl = 'https://spire-media-public.s3.us-east-2.amazonaws.com/images/1633554409883_L.jpg';

describe('MediaService', function () {
	let mediaService: MediaService;
	const originalImagePath = path.join(tempFolderPath, 'media-service-test-image.jpg');
	const resizedLargeFinalPath = path.join(tempFolderPath, 'media-service-test-image_L.jpg');
	let createdMediaIds = [];

	let uploadData: ImagePyramidUploadData;

	before(async function () {
		mediaService = serviceFactory.get<MediaService>('MediaService');
		fs.copyFileSync(path.join(__dirname, '../resources/media-service-test-image.jpg'), originalImagePath);
	});

	after(async function () {
		const db = dbSingleton.get().media;
		// Clean up test data
		for (let i in createdMediaIds) {
			await db.dbUtil.db.runQuery('DELETE FROM media WHERE id = ?;', [i]);
		}
	});

	it('should generate an image pyramid from an original file', async function () {
		const mediaService = new MediaService();
		let uploadResult = await mediaService.generateImagePyramidAndUpload(originalImagePath, false);

		// Check for files locally (We only do large now, simply just for regression, everything else is using imageKit)
		chai.expect(fs.existsSync(resizedLargeFinalPath)).to.be.true;

		// Check for return results
		chai.expect(uploadResult).to.not.be.false;
		uploadData = uploadResult as ImagePyramidUploadData;
		chai.expect(Object.keys(uploadData.downloadUrls).length).to.equal(1);
		chai.expect(uploadData.storageDetails[0].filePath).to.equal('images/media-service-test-image_L.jpg');
	});

	it('should create a media database entry', async function () {
		const mediaService = new MediaService();

		let result = await mediaService.create({
			companyId: 1,
			uploaderId: 1,
			type: 'imagePyramid',
			urls: {
				thumb: uploadData.downloadUrls[ImagePyramidSizes.LARGE],
				small: uploadData.downloadUrls[ImagePyramidSizes.LARGE],
				large: uploadData.downloadUrls[ImagePyramidSizes.LARGE],
				imageKit: `${config.storage.imageKit.baseUrl}/${mediaService.getFileName(
					uploadData.downloadUrls[ImagePyramidSizes.LARGE]
				)}`
			},
			storageDetails: uploadData.storageDetails
		});
		chai.expect(result).to.not.be.null;
		createdMediaIds.push(result.id);
	});

	it('should get and return an image file name for a given file path', function () {
		const mediaService = new MediaService();
		const fileName: string = mediaService.getFileName(mediaTestUrl);
		chai.expect(fileName).to.exist.and.be.a('string');
		chai.expect(mediaTestUrl).to.include(fileName);
	});
});
