import BackBlaze, {
	BackblazeConfig,
	UploadFailureResult,
	UploadSuccessResult
} from '../../integrations/backblaze/backblaze';
import path from 'path';
import config from '../../utils/config';

// Copy resource file to the temp folder where images are normally uploaded to
import chai from 'chai';

const backBlazeCredentials: BackblazeConfig = {
	accountId: '', //config.backblaze.accountId,
	applicationKey: '', // config.backblaze.applicationKey,
	bucketId: '' // 'a5dce78f8fb2c33c72240e10' // unit-testing bucket
};

let uploadResult: UploadSuccessResult;

describe.skip('Backblaze', function () {
	before(async function () {});

	after(async function () {
		// const db = database.get();
		// // Clean up test data
		// await db.dbArgs.connection.runQuery('DELETE FROM messageThread WHERE id = 9999');
	});

	it("should read a bucket's info", async function () {
		const backblaze = new BackBlaze(backBlazeCredentials);
		let bucketInfo = await backblaze.getBucketInfo(backBlazeCredentials.bucketId);
		chai.expect(bucketInfo).to.not.be.null;
		chai.expect(bucketInfo.bucketName).to.equal('unit-testing');
	});

	it('should upload a file', async function () {
		const backblaze = new BackBlaze(backBlazeCredentials);
		let uploadResponse = await backblaze.uploadFile(
			path.join(__dirname, '../resources/b2-test-file.txt'),
			'/testFolder',
			(event) => {
				console.log(event);
			}
		);

		chai.expect((uploadResponse as UploadFailureResult).err).to.be.undefined;
		uploadResult = uploadResponse as UploadSuccessResult;
		chai.expect(uploadResult.downloadUrl).to.be.not.empty;
		chai.expect(uploadResult.fileId).to.be.not.empty;
		chai.expect(uploadResult.filePath).to.be.equal('/testFolder/b2-test-file.txt');
	});

	it('should get file info', async function () {
		const backblaze = new BackBlaze(backBlazeCredentials);
		let fileInfo = await backblaze.getFileInfo(uploadResult.fileId);
		chai.expect(fileInfo).to.be.not.null;
		chai.expect(fileInfo.contentMd5).to.equal('633a46d777a222f7131893e2d53fa9fd');
	});

	it('should delete the uploaded file', async function () {
		const backblaze = new BackBlaze(backBlazeCredentials);
		let result = await backblaze.deleteFile(uploadResult.fileId, uploadResult.filePath);
		chai.expect(result).to.be.true;
	});
});
