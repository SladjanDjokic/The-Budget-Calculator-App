import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import ReviewService from '../../services/review/review.service';
import serviceFactory from '../../services/serviceFactory';
import { boundMethod } from 'autobind-decorator';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import accessScopes from '../../@decorators/accessScopes';
import roleAuthorization from '../../@decorators/roleAuthorization';
import publicUrl from '../../@decorators/publicUrl';
import { WebUtils } from '../../utils/utils';

export default class ReviewApi extends GeneralApi {
	reviewService: ReviewService;

	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.reviewService = serviceFactory.get<ReviewService>('ReviewService');

		this.app.get(`${pre}/paged`, this.getByPage);
		this.app.get(`${pre}`, this.get);
		this.app.get(`${pre}/for-user`, this.getForUser);
		this.app.get(`${pre}/for-destination`, this.getForDestination);
		this.app.post(`${pre}`, this.create);
		this.app.put(`${pre}`, this.update);
		this.app.put(`${pre}/un-publish`, this.unPublish);
		this.app.put(`${pre}/publish`, this.publish);
		this.app.put(`${pre}/verify`, this.verify);
		this.app.delete(`${pre}`, this.delete);
	}

	@boundMethod
	@publicUrl('GET', '/review/paged')
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Review.Res.Get[]>) {
		let pageDetails: RedSky.PageQuery = this.pageFilterData(req.data);
		const pagedResult: RedSky.RsPagedResponseData<Api.Review.Res.Get[]> = await this.reviewService.getByPage(
			pageDetails
		);
		res.sendPaginated(pagedResult.data, pagedResult.total);
	}

	@boundMethod
	@publicUrl('GET', '/review/')
	async get(req: RsRequest<Api.Review.Req.Get>, res: RsResponse<Api.Review.Res.Get>) {
		const review: Api.Review.Res.Get = await this.reviewService.getById(req.data.id);
		res.sendData(review);
	}

	@boundMethod
	@publicUrl('GET', '/review/reservation')
	async getByReservation(req: RsRequest<Api.Review.Req.Reservation>, res: RsResponse<Api.Review.Res.Get>) {
		const review: Api.Review.Res.Get = await this.reviewService.getByReservation(req.data.reservationId);
		res.sendData(review);
	}

	@boundMethod
	async getForUser(req: RsRequest<Api.Review.Req.ForUser>, res: RsResponse<Api.Review.Res.Get[]>) {
		const userReviews: Api.Review.Res.Get[] = await this.reviewService.getForUser(req.data.userId);
		res.sendData(userReviews);
	}

	@boundMethod
	@publicUrl('GET', '/review/for-destination')
	async getForDestination(
		req: RsRequest<Api.Review.Req.ForDestination>,
		res: RsResponse<Api.Review.Res.ForDestination>
	) {
		let destinationReviews: Api.Review.Res.ForDestination;
		if (req.headers['admin-portal'])
			destinationReviews = await this.reviewService.getAllForDestination(req.data.destinationId);
		else destinationReviews = await this.reviewService.getForDestination(req.data.destinationId);
		res.sendData(destinationReviews);
	}

	@boundMethod
	async create(req: RsRequest<Api.Review.Req.Create>, res: RsResponse<Api.Review.Res.Create>) {
		const createdReview: Api.Review.Res.Create = await this.reviewService.create({
			userId: req.user.id,
			...req.data
		});
		res.sendData(createdReview);
	}

	@boundMethod
	@roleAuthorization('self', 'admin')
	async update(req: RsRequest<Api.Review.Req.Update>, res: RsResponse<Api.Review.Res.Update>) {
		const updatedReview: Api.Review.Res.Update = await this.reviewService.update(req.data);
		res.sendData(updatedReview);
	}

	@boundMethod
	@roleAuthorization('self', 'admin')
	async unPublish(req: RsRequest<Api.Review.Req.UnPublish>, res: RsResponse<Api.Review.Res.Update>) {
		const updatedReview: Api.Review.Res.Update = await this.reviewService.update({
			id: req.data.reviewId,
			status: 'REJECTED'
		});
		res.sendData(updatedReview);
	}

	@boundMethod
	@roleAuthorization('self', 'admin')
	async publish(req: RsRequest<Api.Review.Req.Publish>, res: RsResponse<Api.Review.Res.Update>) {
		const updatedReview: Api.Review.Res.Update = await this.reviewService.update({
			id: req.data.reviewId,
			status: 'APPROVED'
		});
		res.sendData(updatedReview);
	}

	@boundMethod
	@accessScopes('ADMINISTRATION')
	async verify(req: RsRequest<Api.Review.Req.Verify>, res: RsResponse<Api.Review.Res.Update>) {
		const updatedReview: Api.Review.Res.Update = await this.reviewService.verify(
			req.data.reviewId,
			req.user.id,
			WebUtils.getCompanyId(req)
		);
		res.sendData(updatedReview);
	}

	@boundMethod
	@roleAuthorization('self')
	async delete(req: RsRequest<Api.Review.Req.Delete>, res: RsResponse<number>) {
		const deletedId: number = await this.reviewService.delete(req.data.id);
		res.sendData(deletedId);
	}
}
