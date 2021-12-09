import { AvailabilityCacheBlock } from '../../services/reservation/reservation.service';
import ReservationSystem from './reservationSystem.class';
import { UpsellPackageCacheBlock } from '../../services/packages/packages.service';
import { IReservationSystem } from './reservationSystem.interface';
import { IRedisClient } from '../redis/IRedisClient';

export default class ReservationSystemMock extends ReservationSystem {
	getRefreshKeysCalls: number = 0;
	verifyAvailabilityCalls: number = 0;
	createReservationCalls: number = 0;
	cancelReservationCalls: number = 0;
	updateReservationCalls: number = 0;
	getReservationCalls: number = 0;
	mostRecentRequest: any;
	mostRecentCreateRequest: IReservationSystem.CreateReservation.Req;
	mostRecentUpdateRequest: IReservationSystem.UpdateReservation.Req;
	lastReservationId: number = 0;
	itineraryNumber: string = 'newItineraryNumber' + new Date().getTime();
	availabilityKeySetName = 'MockReservationRefreshKeys';
	upsellPackageKeySetName = 'MockUpsellPackageRefreshKeys';
	providerName = 'Mock';

	constructor(
		private accommodationKey: string,
		private upsellPackageKey: string,
		private verification: Api.Reservation.Res.Verification,
		public rates: Array<IReservationSystem.Rate>,
		public reservation: IReservationSystem.GetReservation.Res,
		redisClient: IRedisClient
	) {
		super(redisClient);
	}
	async createReservation(req: IReservationSystem.CreateReservation.Req): Promise<any> {
		this.createReservationCalls++;
		this.mostRecentRequest = req;
		this.mostRecentCreateRequest = req;
		return { id: (++this.lastReservationId).toString(), itineraryNumber: req.itineraryId || this.itineraryNumber };
	}
	async updateReservation(
		req: IReservationSystem.UpdateReservation.Req
	): Promise<IReservationSystem.UpdateReservation.Res> {
		this.updateReservationCalls++;
		this.mostRecentRequest = req;
		this.mostRecentUpdateRequest = req;

		return {
			id: this.reservation.reservationId,
			metaData: {},
			confirmationId: this.reservation.confirmationId,
			itineraryNumber: this.reservation.itineraryId,
			priceDetail: this.reservation.prices,
			cancellationPermitted: this.reservation.cancellationPermitted
		};
	}

	async getAvailabilityRefreshKeys(): Promise<any> {
		this.getRefreshKeysCalls++;
		return { refresh: this.accommodationKey };
	}
	async updateRefreshKey() {}
	async getAvailabilityForBlock(
		companyDetails: RedSky.IntegrationCompanyDetails,
		destinationId: number,
		month: number,
		year: number,
		monthTotalDays: number
	): Promise<AvailabilityCacheBlock> {
		return {
			[this.accommodationKey]: {
				companyId: companyDetails.id,
				destinationId,
				accommodations: []
			}
		};
	}
	async getUpsellPackagesForBlock(
		companyDetails: RedSky.IntegrationCompanyDetails,
		destinationId: number,
		month: number,
		year: number,
		daysInMonth: number
	): Promise<UpsellPackageCacheBlock> {
		return {
			[this.upsellPackageKey]: {
				destinationId,
				upsellPackages: []
			}
		};
	}
	async verifyAvailability(
		req: IReservationSystem.VerifyAvailabilityRequest
	): Promise<Api.Reservation.Res.Verification> {
		this.verifyAvailabilityCalls++;
		this.mostRecentRequest = req;
		return this.verification;
	}
	async cancelReservation(
		req: IReservationSystem.CancelReservation.Req
	): Promise<IReservationSystem.CancelReservation.Res> {
		this.cancelReservationCalls++;
		this.mostRecentRequest = req;
		return { cancellationId: 'cancelled' };
	}

	async getReservation(req: IReservationSystem.GetReservation.Req): Promise<IReservationSystem.GetReservation.Res> {
		this.getReservationCalls++;
		this.mostRecentRequest = req;
		return this.reservation;
	}

	async getAvailableRateCodes(companyDetails: RedSky.IntegrationCompanyDetails, destinationId: number) {
		return this.rates.map((rate) => {
			return { ...rate, destinationId };
		});
	}

	public reset() {
		this.getRefreshKeysCalls = 0;
		this.verifyAvailabilityCalls = 0;
		this.createReservationCalls = 0;
		this.cancelReservationCalls = 0;
		this.getReservationCalls = 0;
		this.mostRecentRequest = null;
		this.mostRecentCreateRequest = null;
		this.lastReservationId = 0;
		this.itineraryNumber = 'newItineraryNumber' + new Date().getTime();
	}
}
