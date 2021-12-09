import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class ReservationValidation extends Validation {
	constructor() {
		super('ReservationValidation');
	}

	private static guestDecoder = JsonDecoder.object(
		{
			firstName: JsonDecoder.string,
			lastName: JsonDecoder.string,
			phone: JsonDecoder.string,
			email: JsonDecoder.string
		},
		'guest'
	);

	'GET:availability' = JsonDecoder.object<Api.Reservation.Req.Availability>(
		{
			startDate: JsonDecoder.string,
			endDate: JsonDecoder.string,
			adultCount: JsonDecoder.number,
			destinationId: JsonDecoder.optional(JsonDecoder.number),
			childCount: JsonDecoder.optional(JsonDecoder.number),
			currencyCode: JsonDecoder.optional(JsonDecoder.string),
			roomClass: JsonDecoder.optional(JsonDecoder.isExactly('adacompliance')),
			sortOrder: JsonDecoder.oneOf([JsonDecoder.isExactly('ASC'), JsonDecoder.isExactly('DESC')], ''),
			priceRangeMin: JsonDecoder.optional(JsonDecoder.number),
			priceRangeMax: JsonDecoder.optional(JsonDecoder.number),
			propertyTypeIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, '')),
			experienceIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, '')),
			amenityIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, '')),
			bedroomCount: JsonDecoder.optional(JsonDecoder.number),
			bathroomCount: JsonDecoder.optional(JsonDecoder.number),
			pagination: JsonDecoder.object<RedSky.PagePagination>(
				{
					page: JsonDecoder.number,
					perPage: JsonDecoder.number
				},
				''
			)
		},
		'reservation/availability'
	);
	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'reservation/paged');
	'GET:verification' = JsonDecoder.object<Api.Reservation.Req.Verification>(
		{
			accommodationId: JsonDecoder.number,
			destinationId: JsonDecoder.number,
			adultCount: JsonDecoder.number,
			childCount: JsonDecoder.number,
			rateCode: JsonDecoder.optional(JsonDecoder.string),
			upsellPackages: JsonDecoder.optional(
				JsonDecoder.array(
					JsonDecoder.object<Api.Reservation.Req.UpsellPackage>(
						{
							id: JsonDecoder.number,
							date: JsonDecoder.optional(JsonDecoder.string),
							time: JsonDecoder.optional(JsonDecoder.string)
						},
						'upsell package'
					),
					'upsell packages'
				)
			),
			arrivalDate: JsonDecoder.string,
			departureDate: JsonDecoder.string,
			numberOfAccommodations: JsonDecoder.number,
			existingReservationId: JsonDecoder.optional(JsonDecoder.number)
		},
		'reservation/verification'
	);
	'POST:' = JsonDecoder.object<Api.Reservation.Req.Create>(
		{
			accommodationId: JsonDecoder.number,
			destinationId: JsonDecoder.optional(JsonDecoder.number),
			adultCount: JsonDecoder.number,
			childCount: JsonDecoder.number,
			arrivalDate: JsonDecoder.string,
			departureDate: JsonDecoder.string,
			numberOfAccommodations: JsonDecoder.number,
			rateCode: JsonDecoder.string,
			upsellPackages: JsonDecoder.optional(
				JsonDecoder.array(
					JsonDecoder.object<Api.Reservation.Req.UpsellPackage>(
						{
							id: JsonDecoder.number,
							date: JsonDecoder.optional(JsonDecoder.string),
							time: JsonDecoder.optional(JsonDecoder.string)
						},
						'upsell package'
					),
					'upsell packages'
				)
			),
			paymentMethodId: JsonDecoder.optional(JsonDecoder.number),
			guest: ReservationValidation.guestDecoder,
			additionalDetails: JsonDecoder.optional(JsonDecoder.string)
		},
		'reservation'
	);
	'PUT:' = JsonDecoder.object<Api.Reservation.Req.Update>(
		{
			id: JsonDecoder.number,
			accommodationId: JsonDecoder.optional(JsonDecoder.number),
			adultCount: JsonDecoder.optional(JsonDecoder.number),
			childCount: JsonDecoder.optional(JsonDecoder.number),
			arrivalDate: JsonDecoder.optional(JsonDecoder.string),
			departureDate: JsonDecoder.optional(JsonDecoder.string),
			numberOfAccommodations: JsonDecoder.optional(JsonDecoder.number),
			rateCode: JsonDecoder.optional(JsonDecoder.string),
			upsellPackages: JsonDecoder.optional(
				JsonDecoder.array(
					JsonDecoder.object<Api.Reservation.Req.UpsellPackage>(
						{
							id: JsonDecoder.number,
							date: JsonDecoder.optional(JsonDecoder.string),
							time: JsonDecoder.optional(JsonDecoder.string)
						},
						'upsell package'
					),
					'upsell packages'
				)
			),
			paymentMethodId: JsonDecoder.optional(JsonDecoder.number),
			guest: JsonDecoder.optional(ReservationValidation.guestDecoder),
			additionalDetails: JsonDecoder.optional(JsonDecoder.string)
		},
		'reservation'
	);
	'PUT:payment-method' = JsonDecoder.object<Api.Reservation.Req.UpdatePayment>(
		{
			itineraryId: JsonDecoder.string,
			paymentMethodId: JsonDecoder.number
		},
		'reservation/payment-method'
	);
	'GET:upcoming' = JsonDecoder.objectStrict<Api.Reservation.Req.Upcoming>(
		{
			limit: JsonDecoder.number
		},
		'reservation/upcoming'
	);
	'GET:itinerary' = JsonDecoder.oneOf<any>(
		[
			JsonDecoder.objectStrict(
				{
					itineraryId: JsonDecoder.string
				},
				'itineraryId'
			),
			JsonDecoder.objectStrict(
				{
					reservationId: JsonDecoder.number
				},
				'reservationId'
			)
		],
		'reservation/itinerary'
	);

	'GET:itinerary-paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'reservation/itinerary/paged');

	'POST:itinerary' = JsonDecoder.object<Api.Reservation.Req.Itinerary.Create>(
		{
			destinationId: JsonDecoder.number,
			userId: JsonDecoder.optional(JsonDecoder.number),
			signUp: JsonDecoder.optional(JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], '')),
			payment: JsonDecoder.optional(
				JsonDecoder.objectStrict<Api.Payment.Req.Create>(
					{
						userId: JsonDecoder.optional(JsonDecoder.number),
						cardToken: JsonDecoder.string,
						pmData: JsonDecoder.object<Api.Payment.PmData>(
							{
								address1: JsonDecoder.nullable(JsonDecoder.string),
								address2: JsonDecoder.nullable(JsonDecoder.string),
								callback_url: JsonDecoder.nullable(JsonDecoder.string),
								card_type: JsonDecoder.string,
								city: JsonDecoder.nullable(JsonDecoder.string),
								company: JsonDecoder.nullable(JsonDecoder.string),
								country: JsonDecoder.nullable(JsonDecoder.string),
								created_at: JsonDecoder.nullable(JsonDecoder.string),
								data: JsonDecoder.nullable(JsonDecoder.string),
								eligible_for_card_updater: JsonDecoder.nullable(JsonDecoder.boolean),
								email: JsonDecoder.nullable(JsonDecoder.string),
								errors: JsonDecoder.nullable(JsonDecoder.array(JsonDecoder.string, 'errors')),
								fingerprint: JsonDecoder.nullable(JsonDecoder.string),
								first_name: JsonDecoder.nullable(JsonDecoder.string),
								first_six_digits: JsonDecoder.nullable(JsonDecoder.number),
								full_name: JsonDecoder.string,
								last_four_digits: JsonDecoder.number,
								last_name: JsonDecoder.nullable(JsonDecoder.string),
								metadata: JsonDecoder.nullable(JsonDecoder.string),
								month: JsonDecoder.number,
								number: JsonDecoder.string,
								payment_method_type: JsonDecoder.nullable(JsonDecoder.string),
								phone_number: JsonDecoder.nullable(JsonDecoder.string),
								shipping_address1: JsonDecoder.nullable(JsonDecoder.string),
								shipping_address2: JsonDecoder.nullable(JsonDecoder.string),
								shipping_city: JsonDecoder.nullable(JsonDecoder.string),
								shipping_state: JsonDecoder.nullable(JsonDecoder.string),
								shipping_zip: JsonDecoder.nullable(JsonDecoder.string),
								shipping_country: JsonDecoder.nullable(JsonDecoder.string),
								shipping_phone_number: JsonDecoder.nullable(JsonDecoder.string),
								state: JsonDecoder.nullable(JsonDecoder.string),
								storage_state: JsonDecoder.nullable(JsonDecoder.string),
								test: JsonDecoder.nullable(JsonDecoder.boolean),
								token: JsonDecoder.string,
								updated_at: JsonDecoder.nullable(JsonDecoder.string),
								verification_value: JsonDecoder.nullable(JsonDecoder.string),
								year: JsonDecoder.number,
								zip: JsonDecoder.nullable(JsonDecoder.string)
							},
							'pmData'
						),
						userAddressId: JsonDecoder.optional(JsonDecoder.number),
						isPrimary: JsonDecoder.optional(
							JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isPrimary')
						),
						offsiteLoyaltyEnrollment: JsonDecoder.optional(
							JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'offsiteEnrollment')
						)
					},
					'payment'
				)
			),
			paymentMethodId: JsonDecoder.optional(JsonDecoder.number),
			existingAddressId: JsonDecoder.optional(JsonDecoder.number),
			newAddress: JsonDecoder.optional(
				JsonDecoder.objectStrict<Api.Reservation.Req.Itinerary.UserAddressCreate>(
					{
						type: JsonDecoder.oneOf(
							[
								JsonDecoder.isExactly('SHIPPING'),
								JsonDecoder.isExactly('BILLING'),
								JsonDecoder.isExactly('BOTH')
							],
							'type'
						),
						address1: JsonDecoder.string,
						address2: JsonDecoder.optional(JsonDecoder.string),
						city: JsonDecoder.string,
						state: JsonDecoder.optional(JsonDecoder.string),
						zip: JsonDecoder.number,
						country: JsonDecoder.string,
						isDefault: JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isDefault')
					},
					'newAddress'
				)
			),
			stays: JsonDecoder.array(
				JsonDecoder.objectStrict<Api.Reservation.Req.Itinerary.Stay>(
					{
						accommodationId: JsonDecoder.number,
						rateCode: JsonDecoder.string,
						numberOfAccommodations: JsonDecoder.number,
						adultCount: JsonDecoder.number,
						childCount: JsonDecoder.number,
						arrivalDate: JsonDecoder.string,
						departureDate: JsonDecoder.string,
						guest: ReservationValidation.guestDecoder,
						upsellPackages: JsonDecoder.optional(
							JsonDecoder.array(
								JsonDecoder.object<Api.Reservation.Req.UpsellPackage>(
									{
										id: JsonDecoder.number,
										date: JsonDecoder.optional(JsonDecoder.string),
										time: JsonDecoder.optional(JsonDecoder.string)
									},
									'upsell package'
								),
								'upsell packages'
							)
						),
						additionalDetails: JsonDecoder.optional(JsonDecoder.string)
					},
					'stay'
				),
				'stays'
			)
		},
		'reservation/itinerary'
	);

	'POST:complete' = JsonDecoder.object<Api.Reservation.Req.Complete>(
		{
			confirmationCode: JsonDecoder.string
		},
		'reservation/complete'
	);
}
