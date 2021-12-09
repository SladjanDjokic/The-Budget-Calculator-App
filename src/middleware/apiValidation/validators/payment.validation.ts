import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class PaymentValidation extends Validation {
	constructor() {
		super('PaymentValidation');
	}

	'POST' = JsonDecoder.objectStrict<Api.Payment.Req.Create>(
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
	);

	'PUT:' = JsonDecoder.objectStrict<Api.Payment.Req.Update>(
		{
			id: JsonDecoder.number,
			isPrimary: JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isPrimary')
		},
		'payment'
	);

	'DELETE:' = JsonDecoder.objectStrict<Api.Payment.Req.Delete>(
		{
			id: JsonDecoder.number
		},
		'payment'
	);
}
