import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class UserAddressValidation extends Validation {
	constructor() {
		super('UserAddressValidation');
	}

	'POST:' = JsonDecoder.object<Api.UserAddress.Req.Create>(
		{
			name: JsonDecoder.optional(JsonDecoder.string),
			userId: JsonDecoder.optional(JsonDecoder.number),
			type: JsonDecoder.oneOf(
				[JsonDecoder.isExactly('SHIPPING'), JsonDecoder.isExactly('BILLING'), JsonDecoder.isExactly('BOTH')],
				''
			),
			address1: JsonDecoder.string,
			address2: JsonDecoder.optional(JsonDecoder.string),
			city: JsonDecoder.optional(JsonDecoder.string),
			state: JsonDecoder.string,
			zip: JsonDecoder.number,
			country: JsonDecoder.string,
			isDefault: JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isDefault')
		},
		'userAddress/create'
	);

	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'userAddress/paged');

	'GET:' = JsonDecoder.object<Api.UserAddress.Req.Get>(
		{
			id: JsonDecoder.optional(JsonDecoder.number),
			ids: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, ''))
		},
		'userAddress/'
	);

	'PUT:' = JsonDecoder.object<Api.UserAddress.Req.Update>(
		{
			id: JsonDecoder.number,
			isDefault: JsonDecoder.number,
			name: JsonDecoder.optional(JsonDecoder.string),
			address1: JsonDecoder.optional(JsonDecoder.string),
			address2: JsonDecoder.optional(JsonDecoder.string),
			city: JsonDecoder.optional(JsonDecoder.string),
			state: JsonDecoder.optional(JsonDecoder.string),
			zip: JsonDecoder.optional(JsonDecoder.number),
			country: JsonDecoder.optional(JsonDecoder.string),
			type: JsonDecoder.optional(
				JsonDecoder.oneOf(
					[
						JsonDecoder.isExactly('SHIPPING'),
						JsonDecoder.isExactly('BILLING'),
						JsonDecoder.isExactly('BOTH')
					],
					''
				)
			)
		},
		'userAddress/'
	);
}
