import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import serviceFactory from '../../services/serviceFactory';
import ReservationService from '../../services/reservation/reservation.service';
import { boundMethod } from 'autobind-decorator';
import roleAuthorization from '../../@decorators/roleAuthorization';
import publicUrl from '../../@decorators/publicUrl';
import { WebUtils } from '../../utils/utils';

export default class ReservationApi extends GeneralApi {
	reservationService: ReservationService;
	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.reservationService = serviceFactory.get('ReservationService');

		this.app.get(`${pre}/paged`, this.getByPage);
		this.app.get(`${pre}/verification`, this.verifyAvailability);
		this.app.get(`${pre}`, this.get);
		this.app.put(pre, this.update);
		this.app.get(`${pre}/upcoming`, this.upcomingReservations);
		this.app.post(`${pre}/cancel`, this.cancel);
		this.app.get(`${pre}/itinerary`, this.getItinerary);
		this.app.get(`${pre}/itinerary/paged`, this.getItinerariesByPage);
		this.app.post(`${pre}/itinerary`, this.createItinerary);
		this.app.put(`${pre}/payment-method`, this.updatePaymentMethod);
		this.app.post(`${pre}/complete`, this.completeReservation);
	}

	@boundMethod
	async getByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Reservation.Res.Get[]>) {
		let pageDetails = this.pageFilterData(req.data);
		let userPagedResponse: RedSky.RsPagedResponseData<
			Api.Reservation.Res.Get[]
		> = await this.reservationService.getByPage(
			pageDetails.pagination,
			pageDetails.sort,
			pageDetails.filter,
			WebUtils.getCompanyId(req)
		);
		res.sendPaginated(userPagedResponse.data, userPagedResponse.total);
	}

	@boundMethod
	@publicUrl('GET', '/reservation/verification')
	async verifyAvailability(
		req: RsRequest<Api.Reservation.Req.Verification>,
		res: RsResponse<Api.Reservation.Res.Verification>
	) {
		const result = await this.reservationService.verifyAvailability(req.data);
		res.sendData(result);
	}

	@boundMethod
	async get(req: RsRequest<Api.Reservation.Req.Get>, res: RsResponse<Api.Reservation.Res.Get>) {
		const result: Api.Reservation.Res.Get = await this.reservationService.getById(req.data.id);
		res.sendData(result);
	}

	@boundMethod
	async update(req: RsRequest<Api.Reservation.Req.Update>, res: RsResponse<Api.Reservation.Res.Get>) {
		const result: Api.Reservation.Res.Get = await this.reservationService.update(req.data, req.user.id);
		res.sendData(result);
	}

	@boundMethod
	@roleAuthorization('self', 'admin')
	async updatePaymentMethod(
		req: RsRequest<Api.Reservation.Req.UpdatePayment>,
		res: RsResponse<Api.Reservation.Res.Itinerary.Get>
	) {
		const updatedReservation: Api.Reservation.Res.Itinerary.Get = await this.reservationService.updatePaymentMethod(
			req.data
		);
		res.sendData(updatedReservation);
	}

	@boundMethod
	async cancel(req: RsRequest<Api.Reservation.Req.Cancel>, res: RsResponse<Api.Reservation.Res.Cancel>) {
		const result = await this.reservationService.cancelReservation(req.data.id);
		res.sendData(result);
	}

	@boundMethod
	async upcomingReservations(
		req: RsRequest<Api.Reservation.Req.Upcoming>,
		res: RsResponse<Api.Reservation.Res.Upcoming[]>
	) {
		const result: Api.Reservation.Res.Upcoming[] = await this.reservationService.getUpcomingReservations({
			userId: req.user.id,
			...req.data
		});
		res.sendData(result);
	}

	@boundMethod
	async getItinerary(
		req: RsRequest<Api.Reservation.Req.Itinerary.Get>,
		res: RsResponse<Api.Reservation.Res.Itinerary.Get>
	) {
		let result: Api.Reservation.Res.Itinerary.Get;
		if (!!req.data.reservationId) {
			result = await this.reservationService.getItineraryById(req.data.reservationId);
		} else {
			result = await this.reservationService.getItinerary(req.data.itineraryId);
		}
		res.sendData(result);
	}

	@boundMethod
	async getItinerariesByPage(req: RsRequest<RedSky.PageQuery>, res: RsResponse<Api.Reservation.Res.Itinerary.Get[]>) {
		let pageDetails = this.pageFilterData(req.data);
		if (!!!pageDetails.filter?.searchTerm.some((t) => t.column === 'userId')) {
			pageDetails.filter.searchTerm.push({
				column: 'userId',
				value: req.user.id,
				conjunction: 'AND',
				matchType: 'exact'
			});
		}
		const result = await this.reservationService.getItinerariesByPage(
			pageDetails.pagination,
			pageDetails.sort,
			pageDetails.filter
		);
		res.sendPaginated(result.data, result.total);
	}

	@boundMethod
	@publicUrl('POST', '/reservation/itinerary')
	async createItinerary(
		req: RsRequest<Api.Reservation.Req.Itinerary.Create>,
		res: RsResponse<Api.Reservation.Res.Itinerary.Get>
	) {
		const result = await this.reservationService.createItinerary(req.data);
		res.sendData(result);
	}

	@boundMethod
	@publicUrl('POST', '/reservation/complete')
	async completeReservation(req: RsRequest<Api.Reservation.Req.Complete>, res: RsResponse<Api.Reservation.Res.Get>) {
		const result = await this.reservationService.completeReservation(req.data);
		res.sendData(result);
	}
}
