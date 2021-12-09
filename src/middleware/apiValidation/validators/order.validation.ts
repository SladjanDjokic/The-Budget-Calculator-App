import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class OrderValidation extends Validation {
	constructor() {
		super('OrderValidation');
	}

	'GET' = JsonDecoder.object<Api.Order.Req.Get>({ id: JsonDecoder.number }, 'order');
	'GET:user' = JsonDecoder.object<Api.Order.Req.User>({ userId: JsonDecoder.number }, 'order/user');
	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'order/paged');
	'POST' = JsonDecoder.object<Api.Order.Req.Create>(
		{
			rewardId: JsonDecoder.number,
			voucherId: JsonDecoder.optional(JsonDecoder.number),
			paymentMethodId: JsonDecoder.optional(JsonDecoder.number),
			status: JsonDecoder.oneOf(
				[JsonDecoder.isExactly('PENDING'), JsonDecoder.isExactly('COMPLETED'), JsonDecoder.isExactly('ERROR')],
				''
			),
			type: JsonDecoder.string
		},
		'order'
	);
	'PUT' = JsonDecoder.object<Api.Order.Req.Update>(
		{
			id: JsonDecoder.number,
			paymentMethodId: JsonDecoder.optional(JsonDecoder.number),
			status: JsonDecoder.oneOf(
				[JsonDecoder.isExactly('PENDING'), JsonDecoder.isExactly('COMPLETED'), JsonDecoder.isExactly('ERROR')],
				''
			),
			priceDetail: JsonDecoder.optional(JsonDecoder.string)
		},
		'order'
	);
}
