import GeneralApi from '../GeneralApi';
import path from 'path';
import multer from 'multer';
import { RsError } from '../../utils/errors';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import serviceFactory from '../../services/serviceFactory';
import MediaService, { ImagePyramidSizes, ImagePyramidUploadData } from '../../services/media/media.service';
import { tempFolderPath } from '../../utils/tempStorageHandler';
import { boundMethod } from 'autobind-decorator';
import accessScopes from '../../@decorators/accessScopes';
import { WebUtils } from '../../utils/utils';

let storage = multer.diskStorage({
	destination: function (request, file, cb) {
		cb(null, tempFolderPath);
	},
	filename: function (request, file, cb) {
		cb(null, Date.now() + path.extname(file.originalname));
	}
});

let upload = multer({ storage });

export default class Media extends GeneralApi {
	columns: any;
	tableName: string;
	mediaService: MediaService = serviceFactory.get<MediaService>('MediaService');

	constructor(api_args) {
		super(api_args);
		this.tableName = 'media';
		const pre = this.endpointPrefix;

		this.app.post(pre + '/image/create/pyramid', upload.single('file'), this.uploadImageAndResize);
		this.app.get(pre, this.get);
		this.app.put(pre, this.update);
		this.app.delete(pre, this.delete);
	}

	@boundMethod
	@accessScopes('MEDIA_ACCESS')
	async get(req: RsRequest<Api.Media.Req.Get>, res: RsResponse<Api.Media.Res.Get | Api.Media.Res.Get[]>) {
		if ('id' in req.data) {
			let obj: Api.Media.Res.Get = await this.mediaService.getById(req.data.id, WebUtils.getCompanyId(req));
			res.sendData(obj);
		} else if ('ids' in req.data) {
			let objs = await this.mediaService.getManyByIds(req.data.ids, WebUtils.getCompanyId(req));
			res.sendData(objs);
		} else {
			throw new RsError('BAD_REQUEST', 'Missing id or ids');
		}
	}

	@boundMethod
	@accessScopes('MEDIA_ACCESS')
	async uploadImageAndResize(req: RsRequest<Api.Media.Req.CreateImagePyramid>, res: RsResponse<Api.Media.Res.Get>) {
		if (!req.file) throw new RsError('BAD_REQUEST', 'Missing file on upload.');

		let mediaFile = req.file;
		if (mediaFile.mimetype.indexOf('image') === -1)
			throw new RsError('BAD_REQUEST', 'Unsupported file type trying to be uploaded');

		let keepTransparency = req.body.keepTransparency === 'true';
		let media: Model.Media = await this.mediaService.generateImagePyramidUploadAndCreate(
			req.companyId,
			req.user.id,
			req.file.path,
			keepTransparency
		);
		delete media.storageDetails;
		res.sendData(media);
	}

	@boundMethod
	@accessScopes('MEDIA_ACCESS')
	async update(req: RsRequest<Api.Media.Req.Update>, res: RsResponse<Api.Media.Res.Update>) {
		let result = await this.mediaService.update(req.data.id, req.data);
		res.sendData(result);
	}

	@boundMethod
	@accessScopes('MEDIA_ACCESS')
	async delete(req: RsRequest<Api.Media.Req.Delete>, res: RsResponse<number | number[]>) {
		let result = await this.mediaService.delete(req.data.id);
		res.sendData(result);
	}
}

module.exports = Media;
