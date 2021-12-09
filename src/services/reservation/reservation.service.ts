import { Service } from '../Service';
import ReservationSystemProvider from '../../integrations/reservationSystem/reservationSystemProvider';
import { DateUtils, RedisUtils } from '../../utils/utils';
import { RsError } from '../../utils/errors';
import IReservationTable, {
	ReservationToSave,
	ReservationUpsellPackageToSave
} from '../../database/interfaces/IReservationTable';
import { IRedisClient } from '../../integrations/redis/IRedisClient';
import IDestinationTable from '../../database/interfaces/IDestinationTable';
import IAccommodationTable from '../../database/interfaces/IAccommodationTable';
import ReservationSystem from '../../integrations/reservationSystem/reservationSystem.class';
import logger from '../../utils/logger';
import IUserTable from '../../database/interfaces/IUserTable';
import { ServiceKeyAndDetails } from '../../database/interfaces/IServiceKeyTable';
import IUserPaymentMethodTable from '../../database/interfaces/IUserPaymentMethodTable';
import { UpcomingReservation } from '../../database/objects/reservation.db';
import IEmailService, { EmailMetaData, EmailReplyType, EmailSendImmediate, EmailType } from '../email/IEmailService';
import IUpsellPackageTable from '../../database/interfaces/IUpsellPackageTable';
import IUserPointService from '../userPoint/IUserPointService';
import { IReservationSystem } from '../../integrations/reservationSystem/reservationSystem.interface';
import VaultSystemProvider from '../../integrations/vaultSystem/vaultSystemProvider';
import Vault from '../../integrations/vaultSystem/VaultSystem.class';
import IUserAddressService from '../userAddress/IUserAddressService';
import ICompanyTable from '../../database/interfaces/ICompanyTable';
import { ServiceName } from '../serviceFactory';
import EmailService from '../email/email.service';
import UserPointService from '../userPoint/userPoint.service';
import UserAddressService from '../userAddress/userAddress.service';
import IPaymentService from '../payment/IPaymentService';
import PaymentService from '../payment/payment.service';
import UserService from '../user/user.service';
import IRateTable from '../../database/interfaces/IRateTable';

const DAYS_PER_RESERVATION_REFRESH_BLOCK: number = 7;
const RESERVATION_REFRESH_BLOCKS_PER_BATCH: number = 1;

export interface ReservationRequestToSave extends Partial<Api.Reservation.Req.Create> {
	id?: number;
}

export interface ItineraryToPrepareBooking extends Api.Reservation.Req.Itinerary.Create {
	userAddress: Model.UserAddress;
}

export interface ReservationToCreateUser extends Omit<Api.User.Filtered, 'address'> {
	address: Model.UserAddress;
}

export interface AvailabilityCacheBlock {
	[key: string]: Redis.Availability;
}

interface BookingResource {
	reservationSystemRequest: IReservationSystem.CreateReservation.Req;
	apiRequest: Api.Reservation.Req.Create;
	verification: Api.Reservation.Res.Verification;
}

export default class ReservationService extends Service {
	emailService: IEmailService;
	userPointService: IUserPointService;
	userAddressService: IUserAddressService;
	paymentService: IPaymentService;
	userService: UserService;

	constructor(
		private readonly reservationTable: IReservationTable,
		private readonly destinationTable: IDestinationTable,
		private readonly accommodationTable: IAccommodationTable,
		private readonly upsellPackageTable: IUpsellPackageTable,
		private readonly rateTable: IRateTable,
		private readonly userTable: IUserTable,
		private readonly userPaymentMethodTable: IUserPaymentMethodTable,
		private readonly companyTable: ICompanyTable,
		private readonly redisClient: IRedisClient,
		private readonly reservationSystemProvider: ReservationSystemProvider,
		private readonly vaultSystemProvider: VaultSystemProvider
	) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.emailService = services['EmailService'] as EmailService;
		this.userPointService = services['UserPointService'] as UserPointService;
		this.userAddressService = services['UserAddressService'] as UserAddressService;
		this.paymentService = services['PaymentService'] as PaymentService;
		this.userService = services['UserService'] as UserService;
	}

	async getAvailabilityRefreshKeys(companyId: number): Promise<IReservationSystem.RefreshKeySet> {
		let system: ReservationSystem;
		try {
			({ system } = await this.reservationSystemProvider.get(companyId));
		} catch {
			logger.error(`Unable to get reservation system for ${companyId}`);
			return null;
		}
		return system.getAvailabilityRefreshKeys();
	}

	async syncReservations(): Promise<void> {
		const companies = await this.companyTable.getCompanyIds();
		const expectedDates = ReservationService.getExpectedReservationRefreshDates(DAYS_PER_RESERVATION_REFRESH_BLOCK);
		for (const company of companies) {
			if (!company.id) continue;

			let system: ReservationSystem;
			let companyDetails: ServiceKeyAndDetails;
			try {
				({ system, companyDetails } = await this.reservationSystemProvider.get(company.id));
			} catch {
				logger.warn(`Unable to get reservation system for company ID ${company.id}`);
				continue;
			}

			const companyDestinations: Model.Destination[] = await this.destinationTable.getForCompany(company.id);
			for (let destination of companyDestinations) {
				const redisKey = RedisUtils.generateReservationRefreshDateKey(destination.id);
				const refreshDates: string[] = [];
				for (let i = 1; i <= RESERVATION_REFRESH_BLOCKS_PER_BATCH; i++) {
					refreshDates.push(await this.redisClient.lpop(redisKey));
				}
				for (const refreshDate of refreshDates) {
					if (!expectedDates.includes(refreshDate)) continue;
					// Pull and update the reservations
					const startDate: Date = RedisUtils.getDateObjFromIndex(refreshDate);
					const reservationBlock = await this.reservationTable.getReservationBlock(
						destination.id,
						startDate,
						DAYS_PER_RESERVATION_REFRESH_BLOCK
					);
					for (const res of reservationBlock) {
						let externalReservation = await system.getReservation({
							companyDetails,
							reservationConfirmationId: res.externalConfirmationId,
							destinationId: destination.id
						});
						const updateToSave = ReservationService.formatReservationToSave(
							res.userId,
							res.destinationId,
							externalReservation.accommodationId,
							externalReservation,
							null,
							res.parentReservationId
						);
						await this.reservationTable.update(res.id, updateToSave);
					}
					await this.redisClient.rpush(redisKey, refreshDate);
				}
			}
		}
	}

	async syncRates(): Promise<boolean> {
		let cleanRun: boolean = true;
		const companies = await this.companyTable.getCompanyIds();
		for (const company of companies) {
			try {
				if (!company.id) continue;
				const { system, companyDetails } = await this.reservationSystemProvider.get(company.id);
				const destinations = await this.destinationTable.getForCompany(company.id);
				for (const destination of destinations) {
					try {
						const systemRates: IReservationSystem.Rate[] = await system.getAvailableRateCodes(
							companyDetails,
							destination.id
						);
						const localRates: Model.Rate[] = await this.rateTable.getByDestinationId(destination.id);
						systemRates.forEach((rate) => {
							const existingRate = localRates.find((r) => r.code === rate.code);
							if (!existingRate) {
								this.rateTable.create(rate);
								return;
							}
							if (ReservationService.areRatesEqual(rate, existingRate)) return;
							this.rateTable.update(existingRate.id, rate);
						});
					} catch (e) {
						logger.error(
							`Rate sync failed for destination ${destination.id} - ${
								destination.name
							}:\r\n${JSON.stringify(e)}`
						);
						cleanRun = false;
						continue;
					}
				}
			} catch (e) {
				logger.error(`Rate sync failed for company ${company.id}:\r\n${JSON.stringify(e)}`);
				cleanRun = false;
				continue;
			}
		}
		return cleanRun;
	}

	async updateReservationRefreshDates(): Promise<void> {
		const companies = await this.companyTable.getCompanyIds();
		const expectedDates = ReservationService.getExpectedReservationRefreshDates(DAYS_PER_RESERVATION_REFRESH_BLOCK);

		for (let company of companies) {
			if (!company.id) continue;
			const companyDestinations: Model.Destination[] = await this.destinationTable.getForCompany(company.id);
			for (let destination of companyDestinations) {
				const redisKey = RedisUtils.generateReservationRefreshDateKey(destination.id);
				const existingRefreshDates = (await this.redisClient.getList(redisKey)) || [];
				for (const refreshDate of expectedDates) {
					if (existingRefreshDates.includes(refreshDate)) continue;
					await this.redisClient.lpush(redisKey, refreshDate);
				}
			}
		}
	}

	static getExpectedReservationRefreshDates(daysPerBlock: number): string[] {
		const today = new Date();
		const currentYear = today.getUTCFullYear();
		const currentMonth = today.getUTCMonth() + 1;
		const currentDay = today.getUTCDate();
		const expectedKeys: string[] = [];

		for (let month = 1; month <= 12; month++) {
			const year = month < currentMonth ? currentYear + 1 : currentYear;
			const daysInMonth = DateUtils.daysInMonth(month, year);
			for (let day = 1; day <= daysInMonth; day += daysPerBlock) {
				if (year === currentYear && month === currentMonth && day + daysPerBlock <= currentDay) {
					continue;
				} else {
					expectedKeys.push(RedisUtils.getIndexDate(year, month, day));
				}
			}
		}
		return expectedKeys;
	}

	async updateRefreshKeys(companyId: number, keySet: IReservationSystem.RefreshKeySet): Promise<void> {
		let system: ReservationSystem;
		try {
			({ system } = await this.reservationSystemProvider.get(companyId));
		} catch {
			logger.error(`Unable to get reservation system for ${companyId}`);
			return;
		}
		system.updateAllAvailabilityRefreshKeys(keySet);
	}

	async syncAvailabilityBlock(companyId: number, reservationBlock: string): Promise<AvailabilityCacheBlock> {
		const { system, companyDetails } = await this.reservationSystemProvider.get(companyId);
		let destinationId: number, month: number, year: number, daysInMonth: number;
		try {
			({ destinationId, month, year, daysInMonth } = RedisUtils.getValidBlockInfo(reservationBlock));
		} catch (errorObj) {
			if (errorObj.err === 'BAD_REQUEST') throw new RsError('CANNOT_RESERVE', errorObj.msg);
			throw errorObj;
		}
		const accommodationAvailability = await system.getAvailabilityForBlock(
			companyDetails,
			destinationId,
			month,
			year,
			daysInMonth
		);
		await this.writeAvailabilityToCache(accommodationAvailability);

		return accommodationAvailability;
	}

	async writeAvailabilityToCache(result: AvailabilityCacheBlock) {
		for (let i in result) {
			const resultData = result[i];
			await this.redisClient.set(i, resultData);
		}
	}

	getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Reservation.Res.Get[]>> {
		return this.reservationTable.getByPage(pagination, sort, filter, companyId);
	}

	public isValidReservationDate(month: number, year: number) {
		const today = new Date();
		const currentYear = today.getUTCFullYear();
		if (year > currentYear) return true;
		if (year < currentYear) return false;
		const currentMonth = today.getUTCMonth() + 1;
		return month >= currentMonth;
	}

	async verifyAvailability(request: Api.Reservation.Req.Verification): Promise<Api.Reservation.Res.Verification> {
		const accommodation = await this.accommodationTable.getById(request.accommodationId);
		const destination = await this.destinationTable.getById(accommodation.destinationId);
		const { system, companyDetails } = await this.reservationSystemProvider.get(destination.companyId);
		const existingReservation = !!request.existingReservationId
			? await this.reservationTable.getById(request.existingReservationId)
			: null;
		const confirmAvailabilityRequest: IReservationSystem.VerifyAvailabilityRequest = ReservationService.formatVerifyAvailabilityRequest(
			destination,
			accommodation,
			companyDetails,
			request,
			existingReservation
		);
		const verifiedStay: Api.Reservation.Res.Verification = await system.verifyAvailability(
			confirmAvailabilityRequest
		);
		if (!verifiedStay)
			throw new RsError('BAD_REQUEST', 'This accommodation is no longer available for these dates');
		return verifiedStay;
	}

	async verifyStayAvailability(
		stay: Api.Reservation.Req.Itinerary.Stay,
		destination: Model.Destination,
		reservationSystem: ReservationSystem,
		reservationCompanyDetails: ServiceKeyAndDetails
	): Promise<Api.Reservation.Res.Verification> {
		const accommodation = await this.accommodationTable.getById(stay.accommodationId, reservationCompanyDetails.id);
		const confirmAvailabilityRequest: IReservationSystem.VerifyAvailabilityRequest = {
			companyDetails: reservationCompanyDetails,
			destination: {
				id: destination.id,
				externalId: destination.externalSystemId,
				chainId: destination.chainId
			},
			accommodation: {
				id: accommodation.id,
				externalId: accommodation.externalSystemId,
				quantity: stay.numberOfAccommodations
			},
			adultCount: stay.adultCount,
			childCount: stay.childCount,
			arrivalDate: stay.arrivalDate,
			departureDate: stay.departureDate,
			upsellPackages: stay.upsellPackages,
			rateCode: stay.rateCode
		};
		const verifiedStay: Api.Reservation.Res.Verification = await reservationSystem.verifyAvailability(
			confirmAvailabilityRequest
		);
		if (!verifiedStay)
			throw new RsError('BAD_REQUEST', 'This accommodation is no longer available for these dates');
		return verifiedStay;
	}

	async update(updateRequest: Api.Reservation.Req.Update, userId: number): Promise<Api.Reservation.Res.Get> {
		const existingReservation: Api.Reservation.Res.Get = await this.getById(updateRequest.id);
		const cleanUpdate: Api.Reservation.Req.Update = ReservationService.getStayDifferences(
			updateRequest,
			existingReservation
		);
		const spireDestination = await this.destinationTable.getById(existingReservation.destination.id);
		const spireAccommodation = await this.accommodationTable.getById(
			cleanUpdate.accommodationId || existingReservation.accommodation.id
		);
		const user = await this.userTable.getById(userId);
		if (!!!user.address.length) throw new RsError('BAD_REQUEST', 'User has no address on file');
		const primaryAddress = user.address.find(function (address: Api.User.Address): boolean {
			return !!address.isDefault;
		});
		const upsellPackages: Api.UpsellPackage.Details[] = await this.getUpsellPackagesForUpdate(
			cleanUpdate.upsellPackages,
			existingReservation.upsellPackages
		);
		const { system, companyDetails } = await this.reservationSystemProvider.get(spireDestination.companyId);
		const verificationRequest: IReservationSystem.VerifyAvailabilityRequest = ReservationService.formatVerifyAvailabilityRequest(
			spireDestination,
			spireAccommodation,
			companyDetails,
			updateRequest,
			existingReservation
		);
		const verificationResult = await system.verifyAvailability(verificationRequest);
		if (!verificationResult)
			throw new RsError('BAD_REQUEST', 'These options are not available for the requested dates');

		const pointCostDifference: number =
			verificationResult.prices.grandTotalPoints - existingReservation.priceDetail.grandTotalPoints;
		if (
			!!!existingReservation.paymentMethod &&
			pointCostDifference > 0 &&
			user.availablePoints < pointCostDifference
		) {
			throw new RsError('BAD_REQUEST', 'Not enough available points');
		}
		const formattedUpdateRequest: IReservationSystem.UpdateReservation.Req = ReservationService.formatUpdateReservationRequest(
			existingReservation,
			cleanUpdate,
			upsellPackages,
			companyDetails,
			spireDestination,
			spireAccommodation,
			primaryAddress
		);
		const updateResult = await system.updateReservation(formattedUpdateRequest);
		const updatedReservation = await system.getReservation({
			companyDetails,
			reservationConfirmationId: updateResult.confirmationId,
			destinationId: spireDestination.id
		});
		const reservationToSave = ReservationService.formatReservationToSave(
			userId,
			spireDestination.id,
			spireAccommodation.id,
			updatedReservation,
			null,
			null
		);

		if (!!!existingReservation.paymentMethod) {
			const status: Model.UserPointStatusTypes = pointCostDifference > 0 ? 'REDEEMED' : 'RECEIVED';
			this.userPointService.create({
				pointAmount: Math.abs(pointCostDifference),
				pointType: 'BOOKING',
				reason: 'HOTEL_STAY',
				reservationId: existingReservation.id,
				userId: user.id,
				notes: 'Modified reservation',
				status
			});
		}

		let emailObj: EmailSendImmediate = {
			templateType: EmailType.BOOKING_MODIFICATION,
			recipientEmail: reservationToSave.guestEmail,
			emailReplyType: EmailReplyType.RESERVATION,
			metaData: {
				guest_name: `${reservationToSave.guestFirstName} ${reservationToSave.guestLastName}`,
				resort_name: spireDestination.name,
				arrival_date: DateUtils.formatDateForUser(updateRequest.arrivalDate),
				departure_date: DateUtils.formatDateForUser(updateRequest.departureDate),
				confirmation: updateResult.confirmationId,
				checkin_time: DateUtils.convertTwentyFourHourTime('1600'),
				checkout_time: DateUtils.convertTwentyFourHourTime('1000'),
				room_type: spireAccommodation.name,
				number_of_rooms: spireAccommodation.bedroomCount ? spireAccommodation.bedroomCount.toString() : '1',
				points_used: '0',
				nights_qty: DateUtils.daysBetweenStartAndEndDates(
					new Date(reservationToSave.arrivalDate),
					new Date(reservationToSave.departureDate)
				).toString()
			}
		};

		await this.emailService.sendImmediate(emailObj);
		return this.reservationTable.update(cleanUpdate.id, {
			...reservationToSave,
			additionalDetails: formattedUpdateRequest.additionalDetails
		});
	}

	async completeReservation(data: Api.Reservation.Req.Complete): Promise<Api.Reservation.Res.Get> {
		const completedReservation = await this.reservationTable.completeReservation(data.confirmationCode);
		await this.userPointService.awardPoints(completedReservation.id);
		return await this.reservationTable.getById(completedReservation.id);
	}

	async createItinerary(
		itineraryToCreate: Api.Reservation.Req.Itinerary.Create
	): Promise<Api.Reservation.Res.Itinerary.Get> {
		const destination = await this.destinationTable.getById(itineraryToCreate.destinationId);
		if (itineraryToCreate.userId) {
			if (itineraryToCreate.paymentMethodId === undefined && itineraryToCreate.payment) {
				const payment = await this.paymentService.addPayment({
					...itineraryToCreate.payment,
					userId: itineraryToCreate.userId
				});
				itineraryToCreate.paymentMethodId = payment.id;
			}
		} else {
			//create user
			const stay = itineraryToCreate.stays[0];
			const user = await this.userService.getOrCreate(
				{
					firstName: stay.guest.firstName,
					lastName: stay.guest.lastName,
					primaryEmail: stay.guest.email,
					phone: stay.guest.phone,
					enroll: itineraryToCreate.signUp || 0,
					address: itineraryToCreate.newAddress
				},
				''
			);
			itineraryToCreate.userId = user.id;
			//create payment
			if (!itineraryToCreate.payment) throw new RsError('INVALID_PAYMENT', 'Missing payment information');
			const payment = await this.paymentService.addPayment({
				...itineraryToCreate.payment,
				userId: itineraryToCreate.userId
			});
			itineraryToCreate.paymentMethodId = payment.id;
		}
		const userAddress: Model.UserAddress = await this.createOrGetUserAddress(itineraryToCreate);
		const { system, companyDetails } = await this.reservationSystemProvider.get(destination.companyId);
		const bookingResources: BookingResource[] = await this.prepareBookingResources(
			{ ...itineraryToCreate, userAddress },
			destination,
			system,
			companyDetails
		);
		const bookingResult = await this.bookStays(bookingResources, itineraryToCreate.userId, companyDetails, system);
		return this.reservationTable.getItineraryByReservationId(bookingResult.parentReservationId);
	}

	async cancelReservation(reservationId: number): Promise<Api.Reservation.Res.Cancel> {
		const spireReservation = await this.reservationTable.getById(reservationId);
		const spireDestination = await this.destinationTable.getById(spireReservation.destination.id);
		const { system: reservationSystem, companyDetails } = await this.reservationSystemProvider.get(
			spireDestination.companyId
		);
		const cancellationRequest: IReservationSystem.CancelReservation.Req = {
			companyDetails,
			destination: { externalId: spireDestination.externalSystemId },
			reservationId: spireReservation.externalReservationId,
			reservationConfirmationId: spireReservation.externalConfirmationId
		};
		const result: IReservationSystem.CancelReservation.Res = await reservationSystem.cancelReservation(
			cancellationRequest
		);
		if (!!!result) throw new RsError('INTEGRATION_ERROR', 'Cancellation failed');
		await this.reservationTable.cancel(reservationId, result.cancellationId);
		const reservationInfo: Api.Reservation.Res.Get = await this.getById(reservationId);

		let emailObj: EmailSendImmediate = {
			templateType: EmailType.BOOKING_CANCELLATION,
			recipientEmail: reservationInfo.guest.email,
			emailReplyType: EmailReplyType.RESERVATION,
			metaData: {
				guest_name: `${reservationInfo.guest.firstName} ${reservationInfo.guest.lastName}`,
				resort_name: reservationInfo.destination.name,
				arrival_date: DateUtils.formatDateForUser(reservationInfo.arrivalDate),
				departure_date: DateUtils.formatDateForUser(reservationInfo.departureDate),
				confirmation: result.cancellationId,
				checkin_time: DateUtils.convertTwentyFourHourTime('1600'),
				checkout_time: DateUtils.convertTwentyFourHourTime('1000'),
				room_type: reservationInfo.accommodation.name,
				number_of_rooms: reservationInfo.accommodation.roomCount
					? reservationInfo.accommodation.roomCount.toString()
					: '1',
				points_used: '0',
				nights_qty: DateUtils.daysBetweenStartAndEndDates(
					new Date(reservationInfo.arrivalDate),
					new Date(reservationInfo.departureDate)
				).toString()
			}
		};
		await this.emailService.sendImmediate(emailObj);

		if (!!reservationInfo.paymentMethod) {
			await this.userPointService.revokePendingReservationPoints(reservationId);
		} else {
			await this.userPointService.cancelPendingReservationPoints(reservationId);
		}

		return { cancellationId: result.cancellationId };
	}

	getById(reservationId: number): Promise<Api.Reservation.Res.Get> {
		return this.reservationTable.getById(reservationId);
	}

	async getItineraryById(reservationId: number): Promise<Api.Reservation.Res.Itinerary.Get> {
		const itinerary: Api.Reservation.Res.Itinerary.Get = await this.reservationTable.getItineraryByReservationId(
			reservationId
		);
		itinerary.stays = await this.checkReservationStatus(itinerary);
		return itinerary;
	}

	async getItinerary(itineraryNumber: string): Promise<Api.Reservation.Res.Itinerary.Get> {
		const itinerary: Api.Reservation.Res.Itinerary.Get = await this.reservationTable.getItinerary(itineraryNumber);
		itinerary.stays = await this.checkReservationStatus(itinerary);
		return itinerary;
	}

	async checkReservationStatus(
		itinerary: Api.Reservation.Res.Itinerary.Get
	): Promise<Api.Reservation.Res.Itinerary.Stay[]> {
		let system: ReservationSystem;
		let companyDetails: RedSky.IntegrationCompanyDetails;
		try {
			({ system, companyDetails } = await this.reservationSystemProvider.get(itinerary.destination.companyId));
		} catch {
			logger.error(`Unable to get reservation system for ${itinerary.destination.companyId}`);
			return null;
		}
		let stays: Api.Reservation.Res.Itinerary.Stay[] = [];
		for (let stay of itinerary.stays) {
			let reservation = await system.getReservation({
				companyDetails,
				reservationConfirmationId: stay.externalConfirmationId,
				destinationId: itinerary.destination.id,
				guest: stay.guest
			});
			const updateToSave = ReservationService.formatReservationToSave(
				itinerary.userId,
				itinerary.destination.id,
				reservation.accommodationId,
				reservation,
				null,
				itinerary.parentReservationId
			);
			await this.reservationTable.update(stay.reservationId, {
				...updateToSave,
				externalCancellationId: reservation.cancellationId
			});
			stay = {
				...stay,
				cancellationPermitted: reservation.cancellationPermitted ? 1 : 0,
				externalCancellationId: reservation.cancellationId,
				guest: {
					firstName: reservation.guest.firstName,
					lastName: reservation.guest.lastName,
					email: reservation.guest.email,
					phone: reservation.guest.phone
				},
				additionalDetails: reservation.additionalDetails
			};
			stays.push(stay);
		}
		return stays;
	}

	getItinerariesByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	): Promise<RedSky.RsPagedResponseData<Api.Reservation.Res.Itinerary.Get[]>> {
		return this.reservationTable.getItinerariesByPage(pagination, sort, filter);
	}

	async getUpcomingReservations(details: UpcomingReservation): Promise<Api.Reservation.Res.Upcoming[]> {
		return this.reservationTable.getUpcomingReservations(details);
	}

	/**
	 * updatePaymentMethod - Currently will update all reservations on a given itinerary, we need to eventually update this to live on a reservation not itinerary
	 * @param {Api.Reservation.Req.UpdatePayment} itineraryPaymentUpdateDetails
	 * @returns {Api.Reservation.Res.Get}
	 */
	async updatePaymentMethod(
		itineraryPaymentUpdateDetails: Api.Reservation.Req.UpdatePayment
	): Promise<Api.Reservation.Res.Itinerary.Get> {
		const itinerary: Api.Reservation.Res.Itinerary.Get = await this.getItinerary(
			itineraryPaymentUpdateDetails.itineraryId
		);
		const { system: vaultSystem, companyDetails } = await this.vaultSystemProvider.get();
		await this.updateItineraryPaymentMethod(
			vaultSystem,
			companyDetails,
			itinerary,
			itineraryPaymentUpdateDetails.paymentMethodId
		);
		return await this.getItinerary(itineraryPaymentUpdateDetails.itineraryId);
	}

	private static formatCreateReservationRequest(
		request: Api.Reservation.Req.Create,
		companyDetails: ServiceKeyAndDetails,
		spireUser: ReservationToCreateUser,
		spireDestination: Model.Destination,
		spireAccommodation: Model.Accommodation,
		upsellPackages: Model.UpsellPackage[],
		paymentMethod: Model.UserPaymentMethod,
		priceDetail: Api.Reservation.PriceDetail
	): IReservationSystem.CreateReservation.Req {
		const primaryAddress = { ...spireUser.address, zip: spireUser.address.zip.toString() };
		return {
			companyDetails,
			destination: {
				id: spireDestination.id,
				externalId: spireDestination.externalSystemId,
				chainId: spireDestination.chainId,
				code: spireDestination.code
			},
			stay: {
				accommodationExternalId: spireAccommodation.externalSystemId,
				arrivalDate: request.arrivalDate,
				departureDate: request.departureDate,
				numberOfAccommodations: request.numberOfAccommodations,
				rateCode: request.rateCode,
				upsellPackages
			},
			guestCounts: {
				adultCount: request.adultCount,
				childCount: request.childCount
			},
			primaryGuest: {
				givenName: request.guest.firstName,
				middleName: '',
				surname: request.guest.lastName,
				emailAddress: request.guest.email,
				phoneNumber: request.guest.phone,
				namePrefix: '',
				nameSuffix: '',
				address: primaryAddress
			},
			payment: {
				amountInCents: priceDetail.grandTotalCents,
				token: paymentMethod?.token || undefined,
				cardHolder: paymentMethod?.nameOnCard || undefined,
				expirationMonth: paymentMethod?.expirationMonth.toString() || undefined,
				expirationYearLastTwo: (paymentMethod?.expirationYear % 100).toString() || undefined
			},
			additionalDetails: request.additionalDetails
		};
	}

	private static formatUpdateReservationRequest(
		existingReservation: Api.Reservation.Res.Get,
		updateRequest: Api.Reservation.Req.Update,
		upsellPackages: Api.UpsellPackage.Details[],
		companyDetails: ServiceKeyAndDetails,
		spireDestination: Model.Destination,
		spireAccommodation: Model.Accommodation,
		primaryAddress: Api.User.Address
	): IReservationSystem.UpdateReservation.Req {
		const destination = {
			id: spireDestination.id,
			externalId: spireDestination.externalSystemId,
			chainId: spireDestination.chainId,
			code: spireDestination.code
		};

		const guest = updateRequest.guest || existingReservation.guest;
		const primaryGuest: IReservationSystem.Guest = {
			givenName: guest.firstName,
			middleName: '',
			surname: guest.lastName,
			emailAddress: guest.email,
			phoneNumber: guest.phone,
			namePrefix: '',
			nameSuffix: '',
			address: { ...primaryAddress, zip: primaryAddress.zip.toString() }
		};

		const stay: IReservationSystem.Stay = {
			accommodationExternalId: spireAccommodation.externalSystemId,
			arrivalDate: updateRequest.arrivalDate || existingReservation.arrivalDate,
			departureDate: updateRequest.departureDate || existingReservation.departureDate,
			numberOfAccommodations: updateRequest.numberOfAccommodations || existingReservation.accommodation.roomCount,
			rateCode: updateRequest.rateCode || existingReservation.rateCode,
			upsellPackages
		};

		const guestCounts: IReservationSystem.GuestCounts = {
			adultCount: updateRequest.adultCount || existingReservation.adultCount,
			childCount:
				updateRequest.childCount == undefined ? existingReservation.childCount : updateRequest.childCount
		};

		const additionalDetails = updateRequest.additionalDetails || existingReservation.additionalDetails || null;
		return {
			itineraryId: existingReservation.itineraryId,
			externalReservationId: existingReservation.externalReservationId,
			externalConfirmationId: existingReservation.externalConfirmationId,
			destination,
			companyDetails,
			stay,
			guestCounts,
			primaryGuest,
			additionalDetails
		};
	}

	private static formatVerifyAvailabilityRequest(
		destination: Model.Destination,
		accommodation: Model.Accommodation,
		companyDetails: RedSky.IntegrationCompanyDetails,
		request: Api.Reservation.Req.Verification | Api.Reservation.Req.Update,
		existingReservation?: Api.Reservation.Res.Get
	): IReservationSystem.VerifyAvailabilityRequest {
		if (
			(!!(request as Api.Reservation.Req.Update).id ||
				!!(request as Api.Reservation.Req.Verification).existingReservationId) &&
			!!!existingReservation
		)
			throw new RsError('BAD_REQUEST', 'Update verification must include existing reservation');
		const adultCount = request.adultCount || existingReservation.adultCount;
		const childCount = request.childCount == undefined ? existingReservation.childCount : request.childCount;
		const formattedRequest: IReservationSystem.VerifyAvailabilityRequest = {
			companyDetails,
			destination: {
				id: destination.id,
				externalId: destination.externalSystemId,
				chainId: destination.chainId
			},
			accommodation: {
				id: accommodation.id,
				externalId: accommodation.externalSystemId,
				quantity: request.numberOfAccommodations || existingReservation.numberOfAccommodations || 1
			},
			adultCount,
			childCount,

			arrivalDate: request.arrivalDate || existingReservation.arrivalDate,
			departureDate: request.departureDate || existingReservation.departureDate
		};
		if (!!existingReservation) formattedRequest.existingConfirmationId = existingReservation.externalConfirmationId;
		const rateCode = request.rateCode || existingReservation?.rateCode;
		if (!!rateCode) formattedRequest.rateCode = rateCode;
		const upsellPackages = request.upsellPackages || existingReservation?.upsellPackages;
		if (upsellPackages !== null && upsellPackages !== undefined) formattedRequest.upsellPackages = upsellPackages;
		return formattedRequest;
	}

	private static getStayDifferences(
		update: Api.Reservation.Req.Update,
		existing: Api.Reservation.Res.Get
	): Api.Reservation.Req.Update {
		const result = { ...update };
		if (update.accommodationId === existing.accommodation.id) delete result.accommodationId;
		if (update.adultCount === existing.adultCount) delete result.adultCount;
		if (update.childCount === existing.childCount) delete result.childCount;
		if (new Date(update.arrivalDate) == new Date(existing.arrivalDate)) delete result.arrivalDate;
		if (new Date(update.departureDate) == new Date(existing.departureDate)) delete result.departureDate;
		if (update.numberOfAccommodations === existing.accommodation.roomCount) delete result.numberOfAccommodations;
		if (!!update.upsellPackages) {
			const updatedUpsellPackageIds = update.upsellPackages.map((p) => p.id);
			const existingUpsellPackageIds = existing.upsellPackages.map((p) => p.id);
			if (
				updatedUpsellPackageIds.every((up) => existingUpsellPackageIds.includes(up)) &&
				existingUpsellPackageIds.every((up) => updatedUpsellPackageIds.includes(up))
			)
				delete result.upsellPackages;
		}
		return result;
	}

	private async prepareBookingResources(
		itineraryToCreate: ItineraryToPrepareBooking,
		spireDestination: Model.Destination,
		system: ReservationSystem,
		companyDetails: ServiceKeyAndDetails
	): Promise<BookingResource[]> {
		const { address, ...spireUser } = await this.userTable.getById(itineraryToCreate.userId);
		let paymentMethod: Model.UserPaymentMethod;
		if (!!itineraryToCreate.paymentMethodId)
			paymentMethod = await this.userPaymentMethodTable.getById(itineraryToCreate.paymentMethodId);

		const bookingResources: BookingResource[] = [];
		for (let stay of itineraryToCreate.stays) {
			const spireAccommodation = await this.accommodationTable.getById(stay.accommodationId, companyDetails.id);

			const packageIds = stay.upsellPackages?.map((p) => p.id) || [];
			const spireUpsellPackages = !!packageIds.length
				? await this.upsellPackageTable.getManyByIds(packageIds, companyDetails.id)
				: [];

			const verifiedStay = await this.verifyStayAvailability(stay, spireDestination, system, companyDetails);

			const apiRequest = {
				...stay,
				adults: stay.adultCount,
				children: stay.childCount,
				destinationId: itineraryToCreate.destinationId,
				paymentMethodId: itineraryToCreate.paymentMethodId
			};
			const reservationSystemRequest: IReservationSystem.CreateReservation.Req = ReservationService.formatCreateReservationRequest(
				apiRequest,
				companyDetails,
				{ ...spireUser, address: itineraryToCreate.userAddress },
				spireDestination,
				spireAccommodation,
				spireUpsellPackages,
				paymentMethod,
				verifiedStay.prices
			);
			bookingResources.push({
				reservationSystemRequest,
				apiRequest,
				verification: verifiedStay
			});
		}
		if (!!!paymentMethod) {
			const totalPointCost: number = bookingResources.reduce<number>(
				(accumulate: number, resource: BookingResource) => {
					return accumulate + resource.verification.prices.grandTotalPoints;
				},
				0
			);

			if (spireUser.availablePoints < totalPointCost)
				throw new RsError('DECLINED_PAYMENT', 'Not enough available points');
		}

		return bookingResources;
	}

	private async bookStays(
		resources: BookingResource[],
		userId: number,
		companyDetails: ServiceKeyAndDetails,
		reservationSystem: ReservationSystem
	): Promise<{ parentReservationId: number }> {
		let itineraryId: string = null,
			parentReservationId: number | null = null;
		const { system: vaultSystem, companyDetails: vaultCompanyDetails } = await this.vaultSystemProvider.get();
		for (let { reservationSystemRequest, apiRequest, verification } of resources) {
			reservationSystemRequest.itineraryId = itineraryId;
			const additionalDetails = reservationSystemRequest.additionalDetails;
			const creationResult: IReservationSystem.CreateReservation.Res = await reservationSystem.createReservation(
				reservationSystemRequest
			);
			itineraryId = itineraryId || creationResult.itineraryNumber;

			const createdReservation = await reservationSystem.getReservation({
				companyDetails,
				destinationId: apiRequest.destinationId,
				reservationConfirmationId: creationResult.confirmationId
			});

			const reservationToSave: ReservationToSave = ReservationService.formatReservationToSave(
				userId,
				apiRequest.destinationId,
				apiRequest.accommodationId,
				createdReservation,
				apiRequest.paymentMethodId,
				parentReservationId
			);
			reservationToSave.additionalDetails = additionalDetails;
			const savedReservation = await this.reservationTable.create(reservationToSave);
			const spireReservation: Model.Reservation = await this.reservationTable.getModelById(savedReservation.id);
			if (!!apiRequest.paymentMethodId) {
				// WE DO NOT CHARGE PAYMENTS - We simply need to append the paymentMethod to the reservation and its taken care of down stream
				try {
					await vaultSystem.appendPaymentMethod(
						vaultCompanyDetails,
						spireReservation,
						apiRequest.paymentMethodId
					);
				} catch (e) {
					// roll back both local table create and reservationSystem create
					throw e;
				}
			} else {
				await this.userPointService.create({
					pointAmount: reservationToSave.priceDetail.grandTotalPoints,
					userId,
					status: 'REDEEMED',
					pointType: 'BOOKING',
					reason: 'HOTEL_STAY',
					reservationId: spireReservation.id
				});
			}

			/** ToDo: We need will need to update this after we figure out if this is supposed to go through campaigns, and pull from the map table we don't have yet or what.
			 * Basically need to figure out how this is supposed to actually function.
			 * */
			if (reservationToSave.userPaymentMethodId) {
				this.userPointService.createAndCalculateMultiplier({
					pointAmount: reservationToSave.priceDetail.grandTotalCents,
					userId,
					status: 'PENDING', // put in as pending until we figure out how to get confirmation of successful stay (We don't want users to get and use points then cancel) But we need to figure out how we get notified of an actual stay
					pointType: 'BOOKING',
					reason: 'HOTEL_STAY',
					reservationId: spireReservation.id
				});
			}

			if (!!!parentReservationId) parentReservationId = spireReservation.id;
			await this.sendBookingEmail(
				{
					first_name: reservationSystemRequest.primaryGuest.givenName,
					last_name: reservationSystemRequest.primaryGuest.surname,
					resort_name: verification.destinationName,
					arrival_date: DateUtils.displayUserDate(verification.arrivalDate),
					departure_date: DateUtils.displayUserDate(verification.departureDate),
					confirmation: creationResult.confirmationId,
					checkin_time: DateUtils.convertTwentyFourHourTime(verification.checkInTime),
					checkout_time: DateUtils.convertTwentyFourHourTime(verification.checkOutTime),
					room_type: verification.accommodationName,
					guest_name: `${reservationSystemRequest.primaryGuest.givenName} ${reservationSystemRequest.primaryGuest.surname}`,
					number_of_rooms: reservationSystemRequest.stay.numberOfAccommodations.toString(),
					points_used: '0',
					nights_qty: DateUtils.daysBetweenStartAndEndDates(
						new Date(verification.arrivalDate),
						new Date(verification.departureDate)
					).toString()
				},
				reservationSystemRequest.primaryGuest.emailAddress
			);
		}
		return { parentReservationId };
	}

	private async sendBookingEmail(bookingEmailData: EmailMetaData, primaryEmail: string) {
		let emailObj: EmailSendImmediate = {
			templateType: EmailType.BOOKING_CONFIRMATION,
			recipientEmail: primaryEmail,
			emailReplyType: EmailReplyType.RESERVATION,
			metaData: bookingEmailData
		};
		await this.emailService.sendImmediate(emailObj);
	}

	private async updateItineraryPaymentMethod(
		vaultSystem: Vault,
		companyDetails: ServiceKeyAndDetails,
		itinerary: Api.Reservation.Res.Itinerary.Get,
		paymentMethodId: number
	): Promise<void> {
		for (let stay of itinerary.stays) {
			const reservation: Model.Reservation = await this.reservationTable.getModelById(stay.reservationId);
			if (reservation.externalCancellationId) continue;
			await vaultSystem.appendPaymentMethod(companyDetails, reservation, paymentMethodId);
			await this.reservationTable.updatePaymentMethod(reservation.id, paymentMethodId);
		}
	}

	private async getUpsellPackagesForUpdate(
		updatedPackages: Api.Reservation.Req.UpsellPackage[],
		originalPackages: Api.UpsellPackage.Res.Complete[]
	): Promise<Api.UpsellPackage.Details[]> {
		if (!!!updatedPackages) return originalPackages;
		if (!!updatedPackages.length)
			return await this.upsellPackageTable.getManyByIds(updatedPackages.map((up) => up.id));
		return [];
	}

	private static formatReservationToSave(
		userId: number,
		destinationId: number,
		accommodationId: number,
		reservation: IReservationSystem.GetReservation.Res,
		paymentMethodId: number | null = null,
		parentReservationId: number | null = null
	): ReservationToSave {
		const entry: ReservationToSave = {
			userId,
			destinationId,
			accommodationId,
			guestFirstName: reservation.guest.firstName,
			guestLastName: reservation.guest.lastName,
			guestPhone: reservation.guest?.phone,
			guestEmail: reservation.guest?.email,
			rateCode: reservation.rateCode,
			bookingSourceId: null,
			marketSegmentId: null,
			orderId: null,
			arrivalDate: reservation.arrivalDate,
			departureDate: reservation.departureDate,
			status: '',
			externalReservationId: reservation.reservationId,
			externalCancellationId: null,
			adultCount: reservation.adultCount,
			childCount: reservation.childCount,
			externalConfirmationId: reservation.confirmationId,
			confirmationDate: DateUtils.dbNow(),
			userPaymentMethodId: paymentMethodId,
			priceDetail: reservation.prices,
			metaData: reservation.metadata,
			itineraryId: reservation.itineraryId,
			cancellationPermitted: reservation.cancellationPermitted ? 1 : 0,
			parentReservationId,
			upsellPackages: reservation.upsellPackages.map(function (up): ReservationUpsellPackageToSave {
				return { upsellPackageId: up.id, priceDetail: up.priceDetail };
			}),
			additionalDetails: reservation.additionalDetails,
			numberOfAccommodations: reservation.numberOfAccommodations
		};
		for (const col in entry) {
			if (entry[col] == undefined) delete entry[col];
		}
		return entry;
	}

	private static areRatesEqual(rate1: IReservationSystem.Rate, rate2: IReservationSystem.Rate): boolean {
		return (
			rate1.code === rate2.code &&
			rate1.name === rate2.name &&
			rate1.description === rate2.description &&
			rate1.destinationId === rate2.destinationId
		);
	}

	private async createOrGetUserAddress(
		itineraryToCreate: Api.Reservation.Req.Itinerary.Create
	): Promise<Model.UserAddress> {
		if ('existingAddressId' in itineraryToCreate) {
			return this.userAddressService.getById(itineraryToCreate.existingAddressId);
		} else if ('newAddress' in itineraryToCreate) {
			return this.userAddressService.create({
				...itineraryToCreate.newAddress,
				userId: itineraryToCreate.userId
			});
		} else throw new RsError('BAD_REQUEST', 'Address is required');
	}
}
