import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import serviceFactory from '../../services/serviceFactory';
import { boundMethod } from 'autobind-decorator';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import roleAuthorization from '../../@decorators/roleAuthorization';
import { WebUtils } from '../../utils/utils';
import ExperienceService from '../../services/experience/experience.service';
import publicUrl from '../../@decorators/publicUrl';

export default class Experience extends GeneralApi {
	experienceService: ExperienceService;
	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.experienceService = serviceFactory.get<ExperienceService>('ExperienceService');

		this.app.post(`${pre}`, this.createExperience);
		this.app.get(`${pre}`, this.getAllExperiences);
		this.app.put(`${pre}`, this.updateExperience);
		this.app.delete(`${pre}`, this.deleteExperience);

		this.app.post(`${pre}/destination`, this.createDestinationExperience);
		this.app.put(`${pre}/destination`, this.updateDestinationExperience);
		this.app.delete(`${pre}/destination`, this.deleteDestinationExperience);
	}

	@boundMethod
	async createDestinationExperience(
		req: RsRequest<Api.Experience.Req.CreateDestinationExperience>,
		res: RsResponse<Model.DestinationExperience>
	) {
		const result: Model.DestinationExperience = await this.experienceService.createDestinationExperience(req.data);
		res.sendData(result);
	}

	@boundMethod
	async updateDestinationExperience(
		req: RsRequest<Api.Experience.Req.UpdateDestinationExperience>,
		res: RsResponse<Model.DestinationExperience>
	) {
		const result: Model.DestinationExperience = await this.experienceService.updateDestinationExperience(req.data);
		res.sendData(result);
	}

	@boundMethod
	async deleteDestinationExperience(req: RsRequest<Api.Experience.Req.Delete>, res: RsResponse<any>) {
		let result: number | number[];
		if (req.data?.id) result = await this.experienceService.deleteDestinationExperience(req.data.id);
		else if (req.data?.ids) result = await this.experienceService.deleteManyDestinationExperiences(req.data.ids);
		res.sendData(result);
	}

	@boundMethod
	@roleAuthorization('admin')
	async createExperience(req: RsRequest<Api.Experience.Req.Create>, res: RsResponse<Api.Experience.Res.Create>) {
		const createdExperience: Api.Experience.Res.Create = await this.experienceService.createExperience(req.data);
		res.sendData(createdExperience);
	}

	@boundMethod
	@publicUrl('GET', '/experience')
	async getAllExperiences(req: RsRequest<null>, res: RsResponse<Api.Experience.Res.Get[]>) {
		const experiences: Api.Experience.Res.Get[] = await this.experienceService.getAllExperiences();
		res.sendData(experiences);
	}

	@boundMethod
	@roleAuthorization('admin')
	async updateExperience(req: RsRequest<Api.Experience.Req.Update>, res: RsResponse<Api.Experience.Res.Update>) {
		const updatedExperience: Api.Experience.Res.Update = await this.experienceService.updateExperience(req.data);
		res.sendData(updatedExperience);
	}

	@boundMethod
	@roleAuthorization('admin')
	async deleteExperience(req: RsRequest<Api.Experience.Req.Delete>, res: RsResponse<Api.Experience.Res.Delete>) {
		const id: number = await this.experienceService.deleteExperience(req.data.id);
		res.sendData({ id });
	}
}
