import ReservationSystem, { NameMap } from '../reservationSystem.class';
import { DateUtils, NumberUtils, ObjectUtils, RedisUtils, StringUtils } from '../../../utils/utils';
import Sabre from '../../sabre/Sabre';
import logger from '../../../utils/logger';
import { ISabre } from '../../sabre/Sabre.interface';
import IDestinationTable from '../../../database/interfaces/IDestinationTable';
import IAccommodationTable from '../../../database/interfaces/IAccommodationTable';
import { RsError } from '../../../utils/errors';
import IDestinationTaxTable from '../../../database/interfaces/IDestinationTaxTable';
import { ISpreedly } from '../../../integrations/spreedly/ISpreedly';
import IReservationTable from '../../../database/interfaces/IReservationTable';
import IUpsellPackageTable from '../../../database/interfaces/IUpsellPackageTable';
import { AvailabilityCacheBlock } from '../../../services/reservation/reservation.service';
import { IRedisClient } from '../../../integrations/redis/IRedisClient';
import { UpsellPackageToSave } from '../../../database/objects/upsellPackage.db';
import { UpsellPackageCacheBlock } from '../../../services/packages/packages.service';
import { IReservationSystem } from '../reservationSystem.interface';
import serviceFactory from '../../../services/serviceFactory';
import CompanyService from '../../../services/company/company.service';
import IRateTable from '../../../database/interfaces/IRateTable';

export interface AvailabilityOptions {
	startDate: Date | string;
	endDate: Date | string;
	adults: number;
	primaryChannel: string;
	secondaryChannel: string;
	children?: number;
	currencyCode?: string;
	numRooms: number;
	roomClass?: 'adacompliance';
	roomCode?: string;
	rateCode?: string[];
	priceRangeMin?: number;
	priceRangeMax?: number;
	available?: boolean | number;
	crsConfirmationNumber?: string;
}

interface CostBlock {
	[date: string]: number;
}
interface TaxCodeNameMap {
	[taxCode: string]: string;
}
interface Charge {
	name: string;
	amount: number;
}
interface DateOptions {
	startDay: number;
	endDay: number;
	year: number;
	month: number;
}
interface ReservationFormatRequest
	extends Omit<
		IReservationSystem.CreateReservation.Req | IReservationSystem.UpdateReservation.Req,
		'destination' | 'companyDetails' | 'payment'
	> {}

export default class SabreReservationSystem extends ReservationSystem implements ISpreedly.IntegratedReservationSystem {
	private static readonly additionalDetailsCommentId: string = 'SPIRE';

	protected readonly availabilityKeySetName = 'sabreRefreshKeys';
	protected readonly upsellPackageKeySetName = 'sabreUpsellPackageRefreshKeys';
	protected readonly providerName = 'Sabre';

	constructor(
		private readonly reservationTable: IReservationTable,
		private readonly accommodationTable: IAccommodationTable,
		private readonly destinationTable: IDestinationTable,
		private readonly destinationTaxTable: IDestinationTaxTable,
		private readonly upsellPackageTable: IUpsellPackageTable,
		private readonly rateTable: IRateTable,
		protected readonly redisClient: IRedisClient
	) {
		super(redisClient);
	}

	private getConnectorAndDetails(companyDetails: RedSky.IntegrationCompanyDetails) {
		let serviceDetails: ISabre.ReservationServiceDetails = ObjectUtils.smartParse(companyDetails.serviceKey);
		let connector = new Sabre(serviceDetails);
		return { connector, serviceDetails };
	}

	async getAvailabilityForBlock(
		companyDetails: RedSky.IntegrationCompanyDetails,
		destinationId: number,
		month: number,
		year: number,
		daysInMonth: number
	): Promise<AvailabilityCacheBlock> {
		const { connector, serviceDetails } = this.getConnectorAndDetails(companyDetails);
		const localDestination: Model.Destination = await this.destinationTable.getById(
			destinationId,
			companyDetails.id
		);
		const accommodationsFromDb = await this.accommodationTable.allForCompany(companyDetails.id);
		const ratesFromDb = await this.rateTable.getByDestinationId(destinationId);
		const rateDetails: Redis.AvailabilityRate[] = ratesFromDb.map((rate) => {
			return {
				name: StringUtils.removeLineEndings(rate.name),
				description: StringUtils.removeLineEndings(rate.description),
				code: rate.code
			};
		});
		const [startDay] = SabreReservationSystem.formatBlockDates(month, year, daysInMonth);
		const dateOptions: DateOptions = {
			startDay,
			endDay: daysInMonth,
			year,
			month
		};
		const formattedBlock = await SabreReservationSystem.processAvailability(
			companyDetails.id,
			serviceDetails,
			localDestination,
			accommodationsFromDb,
			rateDetails,
			connector,
			dateOptions
		);

		this.updateRefreshKey(destinationId, year, month);
		return formattedBlock;
	}

	async getAvailableRateCodes(
		companyDetails: RedSky.IntegrationCompanyDetails,
		destinationId: number
	): Promise<Array<IReservationSystem.Rate>> {
		const { connector, serviceDetails } = this.getConnectorAndDetails(companyDetails);
		const localDestination: Model.Destination = await this.destinationTable.getById(
			destinationId,
			companyDetails.id
		);
		const rateResponse = await connector.getRates(
			parseInt(localDestination.externalSystemId),
			localDestination.chainId
		);
		return SabreReservationSystem.formatRates(rateResponse, destinationId);
	}

	async getUpsellPackagesForBlock(
		companyDetails: RedSky.IntegrationCompanyDetails,
		destinationId: number,
		month: number,
		year: number,
		daysInMonth: number
	): Promise<UpsellPackageCacheBlock> {
		const localDestination: Model.Destination = await this.destinationTable.getById(
			destinationId,
			companyDetails.id
		);
		const [startDay, startDate, endDate] = SabreReservationSystem.formatBlockDates(month, year, daysInMonth);

		const sabreDynamicPackageResponse: ISabre.DynamicPackage.Res = await this.getDynamicPackages(
			companyDetails,
			localDestination.externalSystemId,
			startDate,
			endDate
		);
		const sabrePackages = sabreDynamicPackageResponse?.Envelope.Body.OTA_HotelAvailRS.Services?.Service || [];
		if (!!!sabrePackages.length) {
			if (startDay > daysInMonth) year += 1;
			this.updateUpsellPackageRefreshKey(destinationId, year, month);
			return {};
		}
		const formattedBlock = await this.formatUpsellPackageBlock(companyDetails.id, destinationId, sabrePackages, {
			startDay,
			endDay: daysInMonth,
			year,
			month
		});
		if (startDay > daysInMonth) year += 1;
		this.updateUpsellPackageRefreshKey(destinationId, year, month);
		return formattedBlock;
	}

	async verifyAvailability({
		companyDetails,
		destination,
		accommodation,
		...request
	}: IReservationSystem.VerifyAvailabilityRequest): Promise<Api.Reservation.Res.Verification> {
		const { connector, serviceDetails } = this.getConnectorAndDetails(companyDetails);
		const availabilityOptions: ISabre.Destination.Req.AccommodationSearch = {
			hotelId: parseInt(destination.externalId),
			chainId: destination.chainId,
			startDate: request.arrivalDate,
			endDate: request.departureDate,
			adults: request.adultCount,
			roomCode: [accommodation.externalId],
			numRooms: accommodation.quantity,
			primaryChannel: serviceDetails.primaryChannel,
			secondaryChannel: serviceDetails.secondaryChannel
		};
		if (!!request.rateCode) availabilityOptions.rateCode = [request.rateCode];
		if (!!request.childCount) availabilityOptions.children = request.childCount;
		const availabilityQueryString = SabreReservationSystem.formatAvailabilityQueryString(availabilityOptions);

		let sabreReservationBlock: ISabre.Destination.Res.AccommodationSearch;
		try {
			sabreReservationBlock = await connector.getHotelAvailability(availabilityQueryString);
		} catch (e) {
			throw new RsError('INTEGRATION_ERROR', `Availability request failed:\r\n${JSON.stringify(e)}`);
		}
		if (sabreReservationBlock.productAvailability.ProductResult !== 'Success') {
			logger.warn(
				'Get Hotel availability from Sabre failed, ' + sabreReservationBlock.productAvailability.ProductResult
			);
			throw new RsError('INTEGRATION_ERROR', sabreReservationBlock.productAvailability.ProductResult);
		}
		const sabreDynamicPackageResponse: ISabre.DynamicPackage.Res = await this.getDynamicPackages(
			companyDetails,
			destination.externalId,
			SabreReservationSystem.formatDate(availabilityOptions.startDate),
			SabreReservationSystem.formatDate(availabilityOptions.endDate)
		);
		const sabreDynamicPackageAvailability = sabreDynamicPackageResponse.Envelope.Body.OTA_HotelAvailRS;
		if (!!sabreDynamicPackageAvailability.Errors) {
			logger.warn(
				'Get upsell package availability from Sabre failed,\r\n' +
					JSON.stringify(sabreDynamicPackageAvailability.Errors.Error)
			);
			throw new RsError('INTEGRATION_ERROR', sabreDynamicPackageAvailability.Errors.Error[0].ShortText);
		}
		const packages = sabreDynamicPackageAvailability.Services?.Service || [];
		const verification: Api.Reservation.Res.Verification = await this.convertReservationBlockToVerification(
			sabreReservationBlock,
			packages,
			{ companyDetails, destination, accommodation, ...request }
		);
		return verification;
	}

	getReceiver(companyDetails: RedSky.IntegrationCompanyDetails): ISpreedly.Models.Receiver {
		const { serviceDetails } = this.getConnectorAndDetails(companyDetails);
		return serviceDetails.receiver;
	}

	async formatReservationChargeRequest(
		reservationId: number,
		amountInCents: number,
		reservationCompanyDetails: RedSky.IntegrationCompanyDetails
	): Promise<[ISpreedly.ReceiverRequestTemplate, string, string[]]> {
		const reservation = await this.reservationTable.getById(reservationId, reservationCompanyDetails.id);
		const { connector, serviceDetails } = this.getConnectorAndDetails(reservationCompanyDetails);
		const url = `${serviceDetails.baseRestUrl}/${serviceDetails.apiVersion}/api/reservation/`;
		const reservationDetails = await connector.getReservation(
			reservation.destination.externalId,
			reservation.externalConfirmationId
		);
		const primaryGuest = reservationDetails.Guests.find((g) => g.Role === 'Primary');
		const chargeRequest: ISpreedly.ReceiverRequestTemplate = `{
			"Id": "${reservationDetails.Id}",
			"CRS_confirmationNumber": "${reservationDetails.CRS_confirmationNumber}",
			"CRSConfirmationNumber": "${reservationDetails.CrsConfirmationNumber}",
			"ItineraryNumber": "${reservationDetails.ItineraryNumber}",
			"Hotel": ${JSON.stringify(reservationDetails.Hotel)},
			"Channels": ${JSON.stringify(reservationDetails.Channels)},
			"Guests": [
				{
					"CRS_referenceNumber": "${primaryGuest.CRS_referenceNumber}",
					"Payments": [
						{
							"Amount": ${NumberUtils.centsToDollars(amountInCents)},
							"Type": "CreditCard",
							"PaymentCard": {
								"AllowedCharges":"A-All Charges",
								"CardHolder": "{{credit_card_first_name}} {{credit_card_last_name}}",
								"CardNumber": "{{credit_card_number}}",
								"CardSecurityCode": "{{credit_card_verification_value}}",
								"ExpireDate":"{{#format_date}}%m%y,{{credit_card_expiration_date}}{{/format_date}}"
							}
						}
					]
				}
			]
		}`;
		const headers: string[] = [
			'charset: utf-8',
			'accept: application/json',
			`Authorization: Bearer ${await connector['getSabreAccessToken']()}`
		];

		return [chargeRequest, url, headers];
	}

	async formatAppendPaymentMethodRequest(
		reservationCompanyDetails: RedSky.IntegrationCompanyDetails,
		spireReservation: Model.Reservation,
		paymentMethod: Model.UserPaymentMethod
	): Promise<[ISpreedly.ReceiverRequestTemplate, string, string[]]> {
		const { connector, serviceDetails } = this.getConnectorAndDetails(reservationCompanyDetails);
		const url = `${serviceDetails.baseRestUrl}/${serviceDetails.apiVersion}/api/reservation/`;
		const headers: string[] = [
			'charset: utf-8',
			'accept: application/json',
			`Authorization: Bearer ${await connector['getSabreAccessToken']()}`
		];
		const reservationDetails = ObjectUtils.smartParse(spireReservation.metaData);
		const primaryGuest = reservationDetails.Guests.find((g) => g.Role === 'Primary');
		const requestTemplate: ISpreedly.ReceiverRequestTemplate = `{
			"Id": "${reservationDetails.Id}",
			"CRS_confirmationNumber": "${reservationDetails.CRS_confirmationNumber}",
			"CRSConfirmationNumber": "${reservationDetails.CRSConfirmationNumber}",
			"ItineraryNumber": "${reservationDetails.ItineraryNumber}",
			"Hotel": ${JSON.stringify(reservationDetails.Hotel)},
			"Channels": ${JSON.stringify(reservationDetails.Channels)},
			"Guests": [
				{
					"CRS_referenceNumber": "${primaryGuest.CRS_referenceNumber}",
					"Payments": [
						{
							"Amount": 0,
							"Type": "CreditCard",
							"PaymentCard": {
								"AllowedCharges":"A-All Charges",
								"CardHolder": "{{credit_card_first_name}} {{credit_card_last_name}}",
								"CardNumber": "{{credit_card_number}}",
								"CardSecurityCode": "{{credit_card_verification_value}}",
								"ExpireDate":"{{#format_date}}%m%y,{{credit_card_expiration_date}}{{/format_date}}"
							}
						}
					]
				}
			]
		}`;

		return [requestTemplate, url, headers];
	}

	async createReservation({
		companyDetails,
		...request
	}: IReservationSystem.CreateReservation.Req): Promise<IReservationSystem.CreateReservation.Res> {
		const { connector, serviceDetails } = this.getConnectorAndDetails(companyDetails);
		const sabreReservationRequest: ISabre.Reservation.Req.Create = SabreReservationSystem.formatReservationRequest(
			{
				companyDetails,
				...request
			},
			serviceDetails
		);
		const result = await connector.bookReservation(sabreReservationRequest);
		if (!!!result?.reservations?.length) {
			let errorMessage = 'No confirmation code returned from Sabre.';
			const resultMessage: string = (result as any).Message;
			if (!!resultMessage?.length) errorMessage += ` ${resultMessage}`;
			throw new RsError('BAD_REQUEST', errorMessage);
		}
		const reservation: ISabre.Reservation.Res.Get = await connector.getReservation(
			request.destination.externalId,
			result.reservations[0].CrsConfirmationNumber
		);
		const redemptionRatio = await serviceFactory.get<CompanyService>('CompanyService').getRedemptionPointRatio();
		return this.formatCompleteReservation(reservation, redemptionRatio);
	}

	async updateReservation(
		request: IReservationSystem.UpdateReservation.Req
	): Promise<IReservationSystem.UpdateReservation.Res> {
		const sabreForbiddenErrorCodes = ['InvalidRateCancelPolicyRestriction', 'NoPackageAvailability'];
		const { connector, serviceDetails } = this.getConnectorAndDetails(request.companyDetails);
		const sabreUpdateRequest: ISabre.Reservation.Req.Update = SabreReservationSystem.formatUpdateRequest(
			request,
			serviceDetails
		);
		try {
			const result = await connector.bookReservation(sabreUpdateRequest);
			if (!!!result?.reservations?.length) {
				throw new RsError('BAD_REQUEST', 'No confirmation returned from Sabre');
			}
			const reservation: ISabre.Reservation.Res.Get = await connector.getReservation(
				request.destination.externalId,
				result.reservations[0].CrsConfirmationNumber
			);
			const redemptionRatio = await serviceFactory
				.get<CompanyService>('CompanyService')
				.getRedemptionPointRatio();
			return this.formatCompleteReservation(reservation, redemptionRatio);
		} catch (e) {
			logger.error(`Sabre - Failure to update reservation ${JSON.stringify(e)}`, { error: e, request });
			let error = ObjectUtils.smartParse(e.msg);
			if (error?.ErrorCode && sabreForbiddenErrorCodes.includes(error.ErrorCode))
				throw new RsError('FORBIDDEN', error.ErrorCode);
			throw e;
		}
	}

	async getReservation(
		request: IReservationSystem.GetReservation.Req
	): Promise<IReservationSystem.GetReservation.Res> {
		const { connector, serviceDetails } = this.getConnectorAndDetails(request.companyDetails);
		const spireDestination = await this.destinationTable.getDestinationDetails(
			request.destinationId,
			request.companyDetails.id
		);
		const reservation: ISabre.Reservation.Res.Get = await connector.getReservation(
			spireDestination.externalId,
			request.reservationConfirmationId
		);
		const spireAccommodation = await this.accommodationTable.forExternalId(
			reservation.RoomStay.Products[0].Product.RoomCode,
			request.destinationId,
			request.companyDetails.id
		);
		const upsellPackages = await this.upsellPackageTable.getByCompany(request.companyDetails.id);
		const redemptionRatio = await serviceFactory.get<CompanyService>('CompanyService').getRedemptionPointRatio();
		return SabreReservationSystem.formatReservation(
			reservation,
			spireAccommodation,
			spireDestination,
			upsellPackages,
			redemptionRatio,
			request.guest
		);
	}

	async cancelReservation(
		request: IReservationSystem.CancelReservation.Req
	): Promise<IReservationSystem.CancelReservation.Res> {
		const { connector } = this.getConnectorAndDetails(request.companyDetails);
		const sabreCancellationRequest: ISabre.Reservation.Req.Cancel = SabreReservationSystem.formatCancellationRequest(
			request
		);
		const result = await connector.cancelReservation(sabreCancellationRequest);

		return SabreReservationSystem.formatCancellationResult(result);
	}

	private static formatCancellationRequest(
		request: IReservationSystem.CancelReservation.Req
	): ISabre.Reservation.Req.Cancel {
		return {
			Hotel: {
				Id: parseInt(request.destination.externalId)
			},
			CrsConfirmationNumber: request.reservationConfirmationId,
			CancellationDetails: {
				Comment: 'Cancelled by Spire'
			}
		};
	}

	private static formatCancellationResult(
		result: ISabre.Reservation.Res.Cancel
	): IReservationSystem.CancelReservation.Res {
		return {
			cancellationId: result.CRSCancellationNumber
		};
	}

	private static formatReservationRequest(
		{ companyDetails, destination, payment, ...spireRequest }: IReservationSystem.CreateReservation.Req,
		serviceDetails: ISabre.ReservationServiceDetails
	): ISabre.Reservation.Req.Create {
		const result: ISabre.Reservation.Req.Create = {
			Chain: {
				Id: destination.chainId
			},
			Hotel: {
				Id: parseInt(destination.externalId),
				Code: destination.code
			},
			Channels: {
				PrimaryChannel: {
					Code: serviceDetails.primaryChannel
				},
				SecondaryChannel: {
					Code: serviceDetails.secondaryChannel
				}
			},
			status: 'Confirmed',
			RoomStay: SabreReservationSystem.formatRoomStay(spireRequest),
			Packages: [],
			Guests: [SabreReservationSystem.formatGuest(spireRequest)],
			Promotion: {}
		};
		if (!!spireRequest.itineraryId?.length) {
			result.ItineraryNumber = spireRequest.itineraryId;
		}
		if (ObjectUtils.isArrayWithData(spireRequest.stay?.upsellPackages)) {
			result.Packages = SabreReservationSystem.formatUpsellPackages(spireRequest);
		}
		if (!!spireRequest?.additionalDetails) {
			result.Notification = {
				DeliveryComments: [
					{
						Id: SabreReservationSystem.additionalDetailsCommentId,
						Comment: spireRequest.additionalDetails
					}
				]
			};
		}
		return result;
	}

	private async convertReservationBlockToVerification(
		sabreReservationBlock: ISabre.Destination.Res.AccommodationSearch,
		sabreDynamicPackages: ISabre.DynamicPackage.Service[],
		request: IReservationSystem.VerifyAvailabilityRequest
	): Promise<Api.Reservation.Res.Verification> {
		const sabreAccommodation = SabreReservationSystem.getMatchingAvailableProduct(
			sabreReservationBlock.productAvailability.Prices,
			request.accommodation.externalId,
			request.accommodation.quantity,
			request.rateCode
		);
		if (!sabreAccommodation) {
			return null;
		}
		const spireAccommodation = await this.accommodationTable.forExternalId(
			request.accommodation.externalId,
			request.destination.id,
			request.companyDetails.id
		);
		const spireDestination = await this.destinationTable.getDestinationDetails(
			request.destination.id,
			request.companyDetails.id
		);
		const taxNameMap = await this.getTaxNameMap(request.destination.id, request.companyDetails.id);
		const dates = DateUtils.getDateRange(
			request.arrivalDate,
			DateUtils.addDays(new Date(request.departureDate), -1)
		);

		let spireUpsellPackages: Api.UpsellPackage.Details[];
		let upsellPackages: Api.UpsellPackage.Res.Complete[] = [];
		if (!!request.upsellPackages?.length) {
			spireUpsellPackages = await this.upsellPackageTable.getManyByIds(
				request.upsellPackages.map((p) => p.id),
				request.companyDetails.id
			);

			upsellPackages = await this.formatBookedUpsellPackages(spireUpsellPackages, sabreDynamicPackages, dates);
		}

		const redemptionRatio = await serviceFactory.get<CompanyService>('CompanyService').getRedemptionPointRatio();
		const prices: Api.Reservation.PriceDetail = SabreReservationSystem.formatAvailabilityCosts(
			dates,
			sabreAccommodation,
			upsellPackages,
			taxNameMap,
			redemptionRatio
		);
		if (!!!prices) return null;

		const verification: Api.Reservation.Res.Verification = {
			arrivalDate: request.arrivalDate,
			departureDate: request.departureDate,
			checkInTime: spireDestination.policies.find((p) => p.type === 'CheckIn').value,
			checkOutTime: spireDestination.policies.find((p) => p.type === 'CheckOut').value,
			adultCount: request.adultCount,
			childCount: request.childCount,
			maxOccupantCount: spireAccommodation.maxOccupantCount,
			prices,
			rateCode: sabreAccommodation.Product.Rate.Code,
			accommodationId: spireAccommodation.id,
			accommodationName: spireAccommodation.name,
			destinationName: spireDestination.name,
			upsellPackages,
			policies: spireDestination.policies
		};
		return verification;
	}
	private async formatBookedUpsellPackages(
		spireUpsellPackages: Api.UpsellPackage.Details[],
		sabreDynamicPackages: ISabre.DynamicPackage.Service[],
		dates: string[]
	): Promise<Api.UpsellPackage.Res.Complete[]> {
		const result: Api.UpsellPackage.Res.Complete[] = [];
		for (const spirePackage of spireUpsellPackages) {
			const matchingSabrePackages = sabreDynamicPackages.filter(
				(dp) =>
					dp.ServiceInventoryCode === spirePackage.code && dates.includes(dp.Price.EffectiveDate.toString())
			);
			if (!!!matchingSabrePackages?.length) continue;
			if (matchingSabrePackages[0].ServicePricingType === 'Per stay') {
				if (dates.every((d) => matchingSabrePackages.some((p) => p.Price.EffectiveDate === d))) {
					const sabreMatch = matchingSabrePackages.find((p) => p.Price.EffectiveDate === dates[0]);
					const redemptionRatio = await serviceFactory
						.get<CompanyService>('CompanyService')
						.getRedemptionPointRatio();
					const priceDetail = SabreReservationSystem.formatUpsellPackagePriceDetail(
						sabreMatch.Price,
						redemptionRatio
					);
					result.push({
						...spirePackage,
						priceDetail
					});
				}
			}
		}
		return result;
	}

	private static formatUpsellPackagePriceDetail(
		price: ISabre.DynamicPackage.ServicePrice,
		redemptionRatio: number
	): Api.UpsellPackage.Res.PriceDetail {
		const amountAfterTax = NumberUtils.dollarsToCents(price.Base.AmountAfterTax);
		const amountBeforeTax = NumberUtils.dollarsToCents(price.Base.AmountBeforeTax);
		const amountPoints = NumberUtils.centsToPoints(amountAfterTax, redemptionRatio);
		return {
			amountAfterTax,
			amountBeforeTax,
			amountPoints
		};
	}

	private async getTaxNameMap(destinationId: number, companyId: number): Promise<TaxCodeNameMap> {
		const nameMap = {};
		const taxes = await this.destinationTaxTable.getForDestination(destinationId, companyId);
		for (let tax of taxes) {
			if (!nameMap[tax.code]) nameMap[tax.code] = {};
			nameMap[tax.code] = tax.name;
		}
		return nameMap;
	}

	private static formatSabreReservationBlock(
		companyId: number,
		destinationId: number,
		sabreReservationBlock: ISabre.Destination.Res.AccommodationSearch,
		accommodationsFromDb: Model.Accommodation[],
		rateDetails: Redis.AvailabilityRate[],
		dateOptions: DateOptions
	): AvailabilityCacheBlock {
		const formattedIndexBlock: AvailabilityCacheBlock = {};
		const sortedLocalAccommodations = ObjectUtils.toObject(accommodationsFromDb, 'externalSystemId');
		const accommodationPricesObj = sabreReservationBlock?.productAvailability?.Prices;
		let currentDay: number = dateOptions.startDay;
		while (currentDay <= dateOptions.endDay) {
			const formattedBlockObj: Redis.Availability = ({
				companyId,
				destinationId,
				accommodations: []
			} as unknown) as Redis.Availability;
			const indexDate = RedisUtils.getIndexDate(dateOptions.year, dateOptions.month, currentDay);
			const indexDateKey = RedisUtils.generateAvailabilityIndexKey(companyId, destinationId, indexDate);
			for (let accommodation of accommodationPricesObj) {
				const localAccommodation: Model.Accommodation =
					sortedLocalAccommodations[accommodation?.Product?.Room?.Code];
				if (
					!SabreReservationSystem.doesAccommodationDateBlockExist(
						localAccommodation.id,
						formattedBlockObj.accommodations
					)
				) {
					const accommodationDateObj = SabreReservationSystem.createNewAccommodationObj(
						localAccommodation,
						accommodation,
						rateDetails,
						indexDate
					);
					formattedBlockObj.accommodations.push(accommodationDateObj);
					continue;
				}
				const additionalAccommodationPrice = SabreReservationSystem.getDailyPriceForDate(
					accommodation,
					rateDetails,
					indexDate
				);
				if (additionalAccommodationPrice) {
					for (let formattedAccommodation of formattedBlockObj.accommodations) {
						if (formattedAccommodation.id !== localAccommodation.id) continue;
						formattedAccommodation.price.push(additionalAccommodationPrice);
					}
				}
			}
			formattedIndexBlock[indexDateKey] = formattedBlockObj;
			currentDay++;
		}
		return formattedIndexBlock;
	}

	private async formatUpsellPackageBlock(
		companyId: number,
		destinationId: number,
		sabrePackages: ISabre.DynamicPackage.Service[],
		dateOptions: DateOptions
	): Promise<UpsellPackageCacheBlock> {
		const formattedIndexBlock: UpsellPackageCacheBlock = {};
		const upsellPackagesFromDb = await this.upsellPackageTable.getByCompany(companyId);
		const sortedLocalUpsellPackages: { [key: string]: Model.UpsellPackage } = ObjectUtils.toObject(
			upsellPackagesFromDb,
			'code'
		);

		let currentDay: number = dateOptions.startDay;
		while (currentDay <= dateOptions.endDay) {
			const formattedBlockObj: Redis.UpsellPackageAvailability = {
				destinationId,
				upsellPackages: []
			};
			const indexDate = RedisUtils.getIndexDate(dateOptions.year, dateOptions.month, currentDay);
			const indexKey = RedisUtils.generateUpsellPackageIndexKey(destinationId, indexDate);
			for (let sabreDynamicPackage of sabrePackages) {
				if (!!!sabreDynamicPackage.Price.Base || sabreDynamicPackage.Price.EffectiveDate !== indexDate)
					continue;
				let localUpsellPackage = sortedLocalUpsellPackages[sabreDynamicPackage.ServiceInventoryCode];
				if (!!!localUpsellPackage) {
					const upsellPackageToSave = SabreReservationSystem.formatUpsellPackageForSaving(
						sabreDynamicPackage,
						companyId,
						destinationId
					);
					localUpsellPackage = await this.upsellPackageTable.create(upsellPackageToSave);
					sortedLocalUpsellPackages[localUpsellPackage.code] = localUpsellPackage;
					continue;
				}
				if (!StringUtils.areEqualInsensitive(sabreDynamicPackage.ServicePricingType, 'Per stay')) continue; // This will change as we implement support for additional pricing models
				if (!this.doesUpsellPackageDateBlockExist(localUpsellPackage.id, formattedBlockObj.upsellPackages)) {
					const redemptionRatio = await serviceFactory
						.get<CompanyService>('CompanyService')
						.getRedemptionPointRatio();
					const upsellPackageDateObj = SabreReservationSystem.createNewUpsellPackageObj(
						localUpsellPackage,
						sabreDynamicPackage,
						redemptionRatio
					);
					formattedBlockObj.upsellPackages.push(upsellPackageDateObj);
				}
			}
			formattedIndexBlock[indexKey] = formattedBlockObj;
			currentDay++;
		}
		return formattedIndexBlock;
	}
	static formatUpsellPackageForSaving(
		sabreDynamicPackage: ISabre.DynamicPackage.Service,
		companyId: number,
		destinationId: number
	): UpsellPackageToSave {
		return {
			code: sabreDynamicPackage.ServiceInventoryCode,
			companyId,
			description:
				sabreDynamicPackage.ServiceDetails.Comments.Comment.find((c) => c.Name === 'Description')?.Text || '',
			destinationId,
			title: sabreDynamicPackage.ServiceDetails.Comments.Comment.find((c) => c.Name === 'Title')?.Text || '',
			externalTitle:
				sabreDynamicPackage.ServiceDetails.Comments.Comment.find((c) => c.Name === 'Title')?.Text || '',
			pricingType: SabreReservationSystem.SabreToLocalPricingTypeMap[sabreDynamicPackage.ServicePricingType]
		};
	}

	private async getDynamicPackages(
		companyDetails: RedSky.IntegrationCompanyDetails,
		sabreDestinationId: string,
		startDate: string,
		endDate: string
	): Promise<ISabre.DynamicPackage.Res> {
		const { connector } = this.getConnectorAndDetails(companyDetails);
		const payload = `
			<OTA_HotelAvailRQ RequestedCurrency="USD" AvailRatesOnly="false" PrimaryLangID="en" MaxResponses="0" ExactMatchOnly="false" BestOnly="false" SummaryOnly="false"  HotelStayOnly="false" xmlns="http://www.opentravel.org/OTA/2003/05">
				<POS>
					<Source>
						<RequestorId ID="10" ID_Context="Synxis">
							<CompanyName Code="WSBE"/>
						</RequestorId>
					</Source>
				</POS>
				<AvailRequestSegments>
					<AvailRequestSegment AvailReqType="NonRoom" >
						<StayDateRange Start="${startDate}" End="${endDate}"/>
						<RoomStayCandidates>
							<RoomStayCandidate Quantity="1">
								<GuestCounts>
									<GuestCount AgeQualifyingCode="10" Count="1" />
								</GuestCounts>
							</RoomStayCandidate>
						</RoomStayCandidates>
						<HotelSearchCriteria>
							<Criterion>
								<HotelRef HotelCode="${sabreDestinationId}" />
							</Criterion>
						</HotelSearchCriteria>
					</AvailRequestSegment>
				</AvailRequestSegments>
			</OTA_HotelAvailRQ>`;
		try {
			return connector.getDynamicPackages(payload);
		} catch (e) {
			throw new RsError('INTEGRATION_ERROR', `Availability request failed:\r\n${JSON.stringify(e)}`);
		}
	}

	private static formatAvailabilityQueryString(options: ISabre.Destination.Req.AccommodationSearch): string {
		const queryString = [];
		for (let i in options) {
			queryString.push(`${i}=${this.formatParameter(options[i])}`);
		}
		return queryString.join('&');
	}

	private static formatParameter(param: any): string {
		if (param instanceof Date) {
			return RedisUtils.getIndexDate(param.getUTCFullYear(), param.getUTCMonth() + 1, param.getUTCDate());
		}
		return param.toString();
	}

	private static doesAccommodationDateBlockExist(
		localAccommodationId: number,
		formattedAccommodationsList: Redis.AvailabilityAccommodation[]
	) {
		for (let accommodation of formattedAccommodationsList) {
			if (accommodation.id === localAccommodationId) return true;
		}
		return false;
	}

	private doesUpsellPackageDateBlockExist(
		localUpsellPackageId: number,
		formattedUpsellPackages: Redis.AvailableUpsellPackage[]
	) {
		return formattedUpsellPackages.some((up) => up.id === localUpsellPackageId);
	}

	private static createNewAccommodationObj(
		localAccommodation: Model.Accommodation,
		accommodation: ISabre.Model.ProductAvailable,
		rateDetails: Redis.AvailabilityRate[],
		indexDate: string
	): Redis.AvailabilityAccommodation {
		const accommodationDateObj = SabreReservationSystem.formatBaseAccommodationObj(localAccommodation);
		const dailyPrice = SabreReservationSystem.getDailyPriceForDate(accommodation, rateDetails, indexDate);
		if (dailyPrice?.total) accommodationDateObj.price.push(dailyPrice);
		return accommodationDateObj;
	}

	private static createNewUpsellPackageObj(
		localUpsellPackage: Model.UpsellPackage,
		dynamicPackage: ISabre.DynamicPackage.Service,
		redemptionRatio: number
	): Redis.AvailableUpsellPackage {
		const amountBeforeTax = NumberUtils.dollarsToCents(dynamicPackage.Price.Base.AmountBeforeTax);
		const amountAfterTax = NumberUtils.dollarsToCents(dynamicPackage.Price.Base.AmountAfterTax);
		const amountPoints = NumberUtils.centsToPoints(amountAfterTax, redemptionRatio);
		return {
			id: localUpsellPackage.id,
			externalId: dynamicPackage.ServiceInventoryCode,
			title: localUpsellPackage.title,
			externalTitle: dynamicPackage.ServiceDetails.Comments.Comment.find((c) => c.Name === 'Title')?.Text || '',
			pricingType: SabreReservationSystem.SabreToLocalPricingTypeMap[dynamicPackage.ServicePricingType],
			quantity: dynamicPackage.Quantity,
			priceDetail: {
				amountBeforeTax,
				amountAfterTax,
				amountPoints
			}
		};
	}

	private static getDailyPriceForDate(
		accommodation: ISabre.Model.ProductAvailable,
		rateDetails: Redis.AvailabilityRate[],
		indexDate: string
	): Redis.AvailabilityAccommodationPrice {
		for (let dailyPrice of accommodation?.Product?.Prices?.Daily) {
			if (!dailyPrice.Date.toString().includes(indexDate)) continue;
			const rateCode = accommodation?.Product?.Rate?.Code;
			if (!rateCode) continue;
			const matchingRate = rateDetails.find((rate) => rate.code === rateCode);
			if (!matchingRate) continue;
			return SabreReservationSystem.formatDailyPrice(
				dailyPrice,
				matchingRate,
				accommodation?.IsMaximumPricedItem,
				accommodation?.IsMinimumPricedItem,
				accommodation?.Product?.StayLimits?.MinimumStay,
				accommodation?.Product?.StayLimits?.MaximumStay
			);
		}
	}

	private static formatBaseAccommodationObj(
		localAccommodation: Model.Accommodation
	): Redis.AvailabilityAccommodation {
		return {
			id: localAccommodation.id,
			name: localAccommodation.name,
			code: localAccommodation.code,
			status: localAccommodation.status,
			maxOccupancy: localAccommodation.maxOccupantCount,
			maxSleeps: localAccommodation.maxSleeps,
			adaCompliant: localAccommodation.adaCompliant ? 1 : 0,
			roomClass: localAccommodation.roomClass,
			price: []
		};
	}

	private static formatDailyPrice(
		priceObj: ISabre.Model.ProductPricesDaily,
		rate: Redis.AvailabilityRate,
		maxPrice: boolean,
		minPrice: boolean,
		minStay?: number,
		maxStay?: number
	): Redis.AvailabilityAccommodationPrice {
		return {
			total: NumberUtils.dollarsToCents(priceObj.Price.Amount),
			currencyCode: priceObj.Price.CurrencyCode,
			qtyAvailable: priceObj.AvailableInventory,
			rate,
			maxPrice,
			minPrice,
			minStay,
			maxStay
		};
	}
	private static formatRates(
		rateResponse: ISabre.Reservation.Res.Rates,
		destinationId: number
	): Array<IReservationSystem.Rate> {
		return rateResponse.rateList.map((rate) => {
			return {
				name: rate.Name,
				description: rate.Details.Description,
				code: rate.Code,
				destinationId
			};
		});
	}
	private formatCompleteReservation(
		sabreReservation: ISabre.Reservation.Res.Get,
		redemptionRatio: number
	): IReservationSystem.CreateReservation.Res {
		const dates = DateUtils.getDateRange(
			sabreReservation.RoomStay.StartDate,
			DateUtils.addDays(new Date(sabreReservation.RoomStay.EndDate), -1)
		);
		const priceDetail: Api.Reservation.PriceDetail = SabreReservationSystem.formatReservationCosts(
			dates,
			sabreReservation,
			redemptionRatio
		);
		return {
			id: sabreReservation.Id,
			confirmationId: sabreReservation.CRS_confirmationNumber,
			itineraryNumber: sabreReservation.ItineraryNumber,
			cancellationPermitted: sabreReservation.CancellationPermitted,
			priceDetail,
			metaData: sabreReservation
		};
	}

	private static formatAvailabilityCosts(
		dates: string[],
		productAvailable: ISabre.Model.ProductAvailable,
		upsellPackages: Api.UpsellPackage.Res.Complete[],
		taxNameMap: TaxCodeNameMap,
		redemptionRatio: number
	): Api.Reservation.PriceDetail {
		const accommodationDailyCostsInCents: CostBlock = {};
		for (let date of dates) {
			for (let dailyPrice of productAvailable.Product.Prices.Daily) {
				if (!dailyPrice.Date.toString().includes(date)) continue;

				accommodationDailyCostsInCents[date] = NumberUtils.dollarsToCents(dailyPrice.Price.Total.Amount);
			}
			if (!!!accommodationDailyCostsInCents[date]) return null;
		}

		const prices = productAvailable.Product.Prices.Total.Price;
		const accommodationTotalInCents = NumberUtils.dollarsToCents(prices.Total.Amount);

		const taxTotalsInCents: Charge[] = prices.Tax.BreakDown.map(function (tax): Charge {
			return { name: taxNameMap[tax.Code], amount: NumberUtils.dollarsToCents(tax.Amount) };
		});

		const feeTotalsInCents: Charge[] = prices.Fees.BreakDown.map(function (fee): Charge {
			return { name: taxNameMap[fee.Code], amount: NumberUtils.dollarsToCents(fee.Amount) };
		});

		const subtotalInCents = NumberUtils.dollarsToCents(prices.Total.AmountWithTaxesFees);
		const subtotalPoints = NumberUtils.centsToPoints(subtotalInCents, redemptionRatio);

		const upsellPackageTotalInCents =
			upsellPackages?.reduce<number>(
				(total: number, upsell: Api.UpsellPackage.Res.Complete) => total + upsell.priceDetail.amountAfterTax,
				0
			) || 0;
		const upsellPackageTotalPoints =
			upsellPackages?.reduce<number>(
				(total: number, upsell: Api.UpsellPackage.Res.Complete) => total + upsell.priceDetail.amountPoints,
				0
			) || 0;

		const grandTotalCents = subtotalInCents + upsellPackageTotalInCents;
		const grandTotalPoints = subtotalPoints + upsellPackageTotalPoints;

		return {
			accommodationDailyCostsInCents,
			accommodationTotalInCents,
			taxTotalsInCents,
			feeTotalsInCents,
			taxAndFeeTotalInCents: NumberUtils.dollarsToCents(prices.Fees.Amount + prices.Tax.Amount),
			subtotalInCents,
			subtotalPoints,
			upsellPackageTotalInCents,
			upsellPackageTotalPoints,
			grandTotalCents,
			grandTotalPoints
		};
	}

	private static formatReservationCosts(
		dates: string[],
		reservation: ISabre.Reservation.Res.Get,
		redemptionRatio: number
	): Api.Reservation.PriceDetail {
		const accommodationDailyCostsInCents: CostBlock = {};
		const breakdown: ISabre.Model.Reservation.PriceBreakdown = reservation.RoomPrices.PriceBreakdowns.find(
			(b) => b.Type === 'Daily'
		);
		if (!breakdown) throw new RsError('INTEGRATION_ERROR', 'No daily rates found on reservation');

		for (let date of dates) {
			for (let dailyPrice of breakdown.ProductPrices) {
				if (!dailyPrice.StartDate.toString().includes(date)) continue;

				accommodationDailyCostsInCents[date] = NumberUtils.dollarsToCents(dailyPrice.Price.TotalAmount);
			}
			if (!!!accommodationDailyCostsInCents[date]) return null;
		}

		const prices = reservation.RoomPrices.TotalPrice.Price;

		const taxTotalsInCents: Charge[] = prices.Tax.Breakdown.map(function (tax): Charge {
			return { name: tax.Name, amount: NumberUtils.dollarsToCents(tax.Amount) };
		});

		const feeTotalsInCents: Charge[] = prices.Fees.Breakdown.map(function (fee): Charge {
			return { name: fee.Name, amount: NumberUtils.dollarsToCents(fee.Amount) };
		});

		const subtotalInCents = NumberUtils.dollarsToCents(prices.TotalAmountIncludingTaxesFees);
		const subtotalPoints = NumberUtils.centsToPoints(subtotalInCents, redemptionRatio);

		const upsellPackageTotalInCents =
			reservation.Packages?.reduce<number>(
				(total, upsell) => total + NumberUtils.dollarsToCents(upsell.Price.TotalAmountIncludingTaxesFees),
				0
			) || 0;
		const upsellPackageTotalPoints =
			reservation.Packages?.reduce<number>(
				(total, upsell) =>
					total +
					NumberUtils.centsToPoints(
						NumberUtils.dollarsToCents(upsell.Price.TotalAmountIncludingTaxesFees),
						redemptionRatio
					),
				0
			) || 0;
		const grandTotalCents = subtotalInCents + upsellPackageTotalInCents;
		const grandTotalPoints = subtotalPoints + upsellPackageTotalPoints;
		return {
			accommodationDailyCostsInCents,
			accommodationTotalInCents: NumberUtils.dollarsToCents(prices.TotalAmount),
			taxTotalsInCents,
			feeTotalsInCents,
			taxAndFeeTotalInCents: NumberUtils.dollarsToCents(prices.Fees.Amount + prices.Tax.Amount),
			subtotalInCents,
			subtotalPoints,
			upsellPackageTotalInCents,
			upsellPackageTotalPoints,
			grandTotalCents,
			grandTotalPoints
		};
	}

	private static formatGuest(spireRequest: ReservationFormatRequest): ISabre.Model.Guest {
		const guest = spireRequest.primaryGuest;
		return {
			Role: 'Primary',
			PersonName: {
				GivenName: guest.givenName,
				MiddleName: guest.middleName,
				Surname: guest.surname,
				Prefix: guest.namePrefix
			},
			EmailAddress: [{ Type: 'Primary', Value: guest.emailAddress }],
			ContactNumbers: [
				{
					Number: guest.phoneNumber,
					Role: 'Unknown',
					Type: 'Voice'
				}
			],
			Locations: [
				{
					Name: 'Primary',
					Address: {
						AddressLine: [guest.address.address1, guest.address.address2],
						City: guest.address.city,
						StateProv: { Code: guest.address.state },
						Country: { Code: guest.address.country },
						PostalCode: guest.address.zip.toString(),
						Type: 'Contact',
						Default: true
					}
				}
			]
		};
	}

	private static formatRoomStay(spireRequest: ReservationFormatRequest): ISabre.Reservation.Req.RoomStay {
		return {
			startDate: spireRequest.stay.arrivalDate,
			endDate: spireRequest.stay.departureDate,
			CheckInDate: spireRequest.stay.arrivalDate,
			CheckOutDate: spireRequest.stay.departureDate,
			GuestCount: [
				{
					AgeQualifyingCode: 'Adult',
					NumGuests: spireRequest.guestCounts.adultCount
				},
				{
					AgeQualifyingCode: 'Child',
					NumGuests: spireRequest.guestCounts.childCount
				}
			],
			NumRooms: spireRequest.stay.numberOfAccommodations,
			Products: [
				{
					Primary: true,
					StartDate: spireRequest.stay.arrivalDate,
					EndDate: spireRequest.stay.departureDate,
					Product: {
						RoomCode: spireRequest.stay.accommodationExternalId,
						RateCode: spireRequest.stay.rateCode
					}
				}
			]
		};
	}

	private static formatUpsellPackages(
		spireRequest: ReservationFormatRequest
	): Array<ISabre.Reservation.Req.UpsellPackage> {
		return (
			spireRequest.stay?.upsellPackages?.map(function (p): ISabre.Reservation.Req.UpsellPackage {
				return {
					Code: p.code,
					Date: p.date || spireRequest.stay.arrivalDate,
					Quantity: 1
				};
			}) || []
		);
	}

	private static getMatchingAvailableProduct(
		products: ISabre.Model.ProductAvailable[],
		accommodationCode: string,
		quantity: number,
		rateCode?: string
	): ISabre.Model.ProductAvailable {
		return products.find(
			(p) =>
				p.Available &&
				p.AvailableInventory >= quantity &&
				p.Product.Room.Code === accommodationCode &&
				(!rateCode || StringUtils.areEqualInsensitive(p.Product.Rate.Code, rateCode))
		);
	}

	private static formatBlockDates(
		month: number,
		year: number,
		endDay: number,
		startDay: number = 1
	): [startDay: number, startDate: string, endDate: string] {
		if (new Date().getUTCMonth() + 1 === month) startDay = Math.max(new Date().getUTCDate(), startDay);
		const startDate = SabreReservationSystem.formatDate(new Date(year, month - 1, startDay));
		const endDateObj = DateUtils.addDays(new Date(startDate), endDay - startDay + 1);
		const endDate = SabreReservationSystem.formatDate(endDateObj);
		return [startDay, startDate, endDate];
	}

	private static formatDate(dateToFormat: string | Date) {
		const dateObj = new Date(dateToFormat);
		return `${dateObj.getUTCFullYear()}-${DateUtils.padStart(
			(dateObj.getUTCMonth() + 1).toString()
		)}-${DateUtils.padStart(dateObj.getUTCDate().toString())}`;
	}

	private static formatReservation(
		reservation: ISabre.Reservation.Res.Get,
		accommodation: Model.Accommodation,
		destination: Api.Destination.Res.Details,
		upsellPackages: Api.UpsellPackage.Details[],
		redemptionRatio,
		guest?: Api.Reservation.Guest
	): IReservationSystem.GetReservation.Res {
		const adults = reservation.RoomStay.GuestCount.find((g) => g.AgeQualifyingCode === 'Adult').NumGuests;
		const children = reservation.RoomStay.GuestCount.find((g) => g.AgeQualifyingCode === 'Child')?.NumGuests || 0;
		const bookedUpsellPackages = this.convertDynamicPackagesToBooked(
			upsellPackages,
			reservation.Packages,
			redemptionRatio
		);
		const priceDates = DateUtils.getDateRange(
			reservation.RoomStay.StartDate,
			// Remove a day because there will be no price for the checkout date
			DateUtils.addDays(new Date(reservation.RoomStay.EndDate), -1)
		);
		const prices = this.formatReservationCosts(priceDates, reservation, redemptionRatio);
		const primaryGuest = reservation.Guests.find((g) => g.Role === 'Primary');
		let phone: string = '';
		if (ObjectUtils.isArrayWithData(primaryGuest.ContactNumbers)) {
			phone =
				primaryGuest.ContactNumbers.find((num) => num.Default)?.Number || primaryGuest.ContactNumbers[0].Number;
		} else {
			phone = guest.phone || '';
		}
		return {
			accommodationId: accommodation.id,
			accommodationName: accommodation.name,
			adultCount: adults,
			childCount: children,
			maxOccupantCount: accommodation.maxOccupantCount,
			arrivalDate: reservation.RoomStay.StartDate,
			departureDate: reservation.RoomStay.EndDate,
			checkInTime: destination.policies.find((p) => p.type === 'CheckIn')?.value,
			checkOutTime: destination.policies.find((p) => p.type === 'CheckOut')?.value,
			destinationName: destination.name,
			policies: destination.policies,
			prices,
			rateCode: reservation.RoomStay.Products[0].Product.RateCode,
			upsellPackages: bookedUpsellPackages,
			additionalDetails: reservation.Notification.DeliveryComments?.find(
				(deliveryComment) => deliveryComment.Id == SabreReservationSystem.additionalDetailsCommentId
			)?.Comment,
			cancellationPermitted: !!reservation.CancellationPermitted,
			confirmationId: reservation.CRS_confirmationNumber,
			itineraryId: reservation.ItineraryNumber,
			reservationId: reservation.Id,
			numberOfAccommodations: reservation.RoomStay.NumRooms,
			cancellationId: reservation.CRSCancellationNumber,
			guest: {
				firstName: primaryGuest.PersonName.GivenName,
				lastName: primaryGuest.PersonName.Surname,
				email:
					primaryGuest.EmailAddress.find((email) => email.Type === 'Primary')?.Value ||
					primaryGuest.EmailAddress[0].Value,
				phone
			},
			metadata: reservation
		};
	}

	private static convertDynamicPackagesToBooked(
		spirePackages: Api.UpsellPackage.Details[],
		sabreDynamicPackages: ISabre.Model.DynamicPackage[],
		redemptionRatio: number
	): Api.UpsellPackage.Res.Complete[] {
		if (!!!spirePackages?.length || !!!sabreDynamicPackages?.length) return [];
		const result: Api.UpsellPackage.Res.Complete[] = [];
		for (const sabre of sabreDynamicPackages) {
			const match = spirePackages.find((p) => p.code === sabre.Code);
			const priceDetail: Api.UpsellPackage.Res.PriceDetail = {
				amountBeforeTax: NumberUtils.dollarsToCents(sabre.Price.TotalAmount),
				amountAfterTax: NumberUtils.dollarsToCents(sabre.Price.TotalAmountIncludingTaxesFees),
				amountPoints: NumberUtils.centsToPoints(
					NumberUtils.dollarsToCents(sabre.Price.TotalAmountIncludingTaxesFees),
					redemptionRatio
				)
			};
			result.push({ ...match, priceDetail });
		}
		return result;
	}

	private static formatUpdateRequest(
		{ companyDetails, destination, payment, ...spireRequest }: IReservationSystem.UpdateReservation.Req,
		serviceDetails: ISabre.ReservationServiceDetails
	): ISabre.Reservation.Req.Update {
		const stay: ISabre.Reservation.Req.Update = {
			CrsConfirmationNumber: spireRequest.externalConfirmationId,
			Chain: {
				Id: destination.chainId
			},
			Hotel: {
				Id: parseInt(destination.externalId),
				Code: destination.code
			},
			Channels: {
				PrimaryChannel: {
					Code: serviceDetails.primaryChannel
				},
				SecondaryChannel: {
					Code: serviceDetails.secondaryChannel
				}
			},
			Guests: [SabreReservationSystem.formatGuest(spireRequest)],
			RoomStay: SabreReservationSystem.formatRoomStay(spireRequest),
			Packages: SabreReservationSystem.formatUpsellPackages(spireRequest),
			Promotion: {},
			status: 'Confirmed'
		};

		if (!!spireRequest?.additionalDetails) {
			stay.Notification = {
				DeliveryComments: [
					{
						Id: SabreReservationSystem.additionalDetailsCommentId,
						Comment: spireRequest.additionalDetails
					}
				]
			};
		}

		return stay;
	}

	private static async processAvailability(
		companyId: number,
		serviceDetails: ISabre.ReservationServiceDetails,
		localDestination: Model.Destination,
		accommodationsFromDb: Model.Accommodation[],
		rateDetails: Redis.AvailabilityRate[],
		connector: Sabre,
		dateOptions: DateOptions
	): Promise<AvailabilityCacheBlock> {
		const [, startDate, endDate] = SabreReservationSystem.formatBlockDates(
			dateOptions.month,
			dateOptions.year,
			dateOptions.endDay,
			dateOptions.startDay
		);
		const availabilityQueryString = SabreReservationSystem.formatAvailabilityQueryString({
			hotelId: parseInt(localDestination.externalSystemId),
			chainId: localDestination.chainId,
			startDate,
			endDate,
			adults: 1,
			numRooms: 1,
			primaryChannel: serviceDetails.primaryChannel,
			secondaryChannel: serviceDetails.secondaryChannel
		});
		const sabreReservationBlock: ISabre.Destination.Res.AccommodationSearch = await connector.getHotelAvailability(
			availabilityQueryString
		);

		if (ObjectUtils.isArrayWithData(sabreReservationBlock?.productAvailability?.Prices)) {
			return SabreReservationSystem.formatSabreReservationBlock(
				companyId,
				localDestination.id,
				sabreReservationBlock,
				accommodationsFromDb,
				rateDetails,
				dateOptions
			);
		}
		if (dateOptions.endDay - dateOptions.startDay === 1) return {};
		const splitDate = dateOptions.startDay + Math.ceil((dateOptions.endDay - dateOptions.startDay) / 2);
		return {
			...(await SabreReservationSystem.processAvailability(
				companyId,
				serviceDetails,
				localDestination,
				accommodationsFromDb,
				rateDetails,
				connector,
				{
					...dateOptions,
					endDay: splitDate
				}
			)),
			...(await SabreReservationSystem.processAvailability(
				companyId,
				serviceDetails,
				localDestination,
				accommodationsFromDb,
				rateDetails,
				connector,
				{
					...dateOptions,
					startDay: splitDate
				}
			))
		};
	}

	private static readonly SabreToLocalPricingTypeMap: NameMap<
		ISabre.ServicePricingType,
		Model.UpsellPackagePricingType
	> = {
		'Per stay': 'PerStay',
		'Per person per night': 'PerGuestPerNight',
		'Per person': 'PerGuest',
		'Per night': 'PerNight'
	};
}
