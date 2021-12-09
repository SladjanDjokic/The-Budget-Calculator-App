import { AvailabilityCacheBlock } from '../../services/reservation/reservation.service';
import { RsError } from '../../utils/errors';
import PaymentSystemProvider from '../paymentSystem/PaymentSystemProvider';
import { UpsellPackageCacheBlock } from '../../services/packages/packages.service';
import { IReservationSystem } from './reservationSystem.interface';
import { IRedisClient } from '../redis/IRedisClient';
import logger from '../../utils/logger';
import { ObjectUtils, RedisUtils } from '../../utils/utils';

export type NameMap<TypeA extends string, TypeB> = {
	[key in TypeA]: TypeB;
};

export default abstract class ReservationSystem {
	protected abstract readonly availabilityKeySetName: string;
	protected abstract readonly upsellPackageKeySetName: string;
	protected abstract readonly providerName: string;
	constructor(protected readonly redisClient: IRedisClient) {}

	async getAvailabilityRefreshKeys(): Promise<IReservationSystem.RefreshKeySet> {
		const redisRefreshKeys = await this.redisClient.get(this.availabilityKeySetName);
		if (!redisRefreshKeys || !Object.keys(redisRefreshKeys).length) {
			logger.error(`No refresh keys found in redis for ${this.providerName}`);
			return null;
		}
		return ObjectUtils.smartParse(redisRefreshKeys);
	}

	async getUpsellPackageRefreshKeys(): Promise<IReservationSystem.RefreshKeySet> {
		const redisRefreshKeys = await this.redisClient.get(this.upsellPackageKeySetName);
		if (!redisRefreshKeys) {
			logger.error(`No refresh keys found in redis for ${this.providerName} upsell packages`);
			return null;
		}
		return ObjectUtils.smartParse(redisRefreshKeys);
	}

	async getReservationRefreshKeys() {}

	async updateRefreshKey(destinationId: number, year: number, month: number) {
		let refreshKeys = await this.getAvailabilityRefreshKeys();
		const refreshKeyValue = RedisUtils.generateRefreshKey(destinationId, year, month);
		for (let i in refreshKeys) {
			if (refreshKeys[i] === refreshKeyValue) delete refreshKeys[i];
		}
		refreshKeys[Date.now()] = refreshKeyValue;
		return this.redisClient.set(this.availabilityKeySetName, refreshKeys);
	}

	async updateAllAvailabilityRefreshKeys(refreshKeys: IReservationSystem.RefreshKeySet) {
		return this.redisClient.set(this.availabilityKeySetName, refreshKeys);
	}
	async updateAllUpsellPackageRefreshKeys(refreshKeys: IReservationSystem.RefreshKeySet) {
		return this.redisClient.set(this.upsellPackageKeySetName, refreshKeys);
	}
	async updateUpsellPackageRefreshKey(destinationId: number, year: number, month: number) {
		let refreshKeys = await this.getUpsellPackageRefreshKeys();
		const refreshKeyValue = RedisUtils.generateRefreshKey(destinationId, year, month);
		for (let i in refreshKeys) {
			if (refreshKeys[i] === refreshKeyValue) delete refreshKeys[i];
		}
		refreshKeys[Date.now()] = refreshKeyValue;
		return this.redisClient.set(this.upsellPackageKeySetName, refreshKeys);
	}

	getAvailabilityForBlock(
		companyDetails: RedSky.IntegrationCompanyDetails,
		destinationId: number,
		month: number,
		year: number,
		monthTotalDays: number
	): Promise<AvailabilityCacheBlock> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}
	getUpsellPackagesForBlock(
		companyDetails: RedSky.IntegrationCompanyDetails,
		destinationId: number,
		month: number,
		year: number,
		daysInMonth: number
	): Promise<UpsellPackageCacheBlock> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}
	getAvailableRateCodes(
		companyDetails: RedSky.IntegrationCompanyDetails,
		destinationId: number
	): Promise<Array<IReservationSystem.Rate>> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}
	verifyAvailability(req: IReservationSystem.VerifyAvailabilityRequest): Promise<Api.Reservation.Res.Verification> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}
	createReservation(
		req: IReservationSystem.CreateReservation.Req
	): Promise<IReservationSystem.CreateReservation.Res> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}
	updateReservation(
		req: IReservationSystem.UpdateReservation.Req
	): Promise<IReservationSystem.UpdateReservation.Res> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}
	getReservation(req: IReservationSystem.GetReservation.Req): Promise<IReservationSystem.GetReservation.Res> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}

	chargeDeposit(
		paymentSystemProvider: PaymentSystemProvider,
		companyId: number,
		reservationId: number,
		paymentMethod: Model.UserPaymentMethod,
		amount: number
	): Promise<any> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}
	cancelReservation(
		req: IReservationSystem.CancelReservation.Req
	): Promise<IReservationSystem.CancelReservation.Res> {
		throw new RsError('SERVICE_UNAVAILABLE', 'Unimplemented method');
	}
}
