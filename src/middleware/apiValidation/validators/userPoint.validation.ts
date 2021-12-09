import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class UserPointValidation extends Validation {
	constructor() {
		super('UserPointValidation');
	}

	'POST:' = JsonDecoder.object<Api.UserPoint.Req.Create>(
		{
			userId: JsonDecoder.optional(JsonDecoder.number),
			pointType: JsonDecoder.oneOf(
				[
					JsonDecoder.isExactly('ACTION'),
					JsonDecoder.isExactly('CAMPAIGN'),
					JsonDecoder.isExactly('ADMIN'),
					JsonDecoder.isExactly('ORDER'),
					JsonDecoder.isExactly('BOOKING'),
					JsonDecoder.isExactly('RENTAL'),
					JsonDecoder.isExactly('VACATION')
				],
				''
			),
			pointAmount: JsonDecoder.number,
			reason: JsonDecoder.oneOf(
				[
					JsonDecoder.isExactly('TECHNICAL_ERROR'),
					JsonDecoder.isExactly('HOTEL_STAY'),
					JsonDecoder.isExactly('RETAIL_TRANSACTION'),
					JsonDecoder.isExactly('RESTAURANT_TRANSACTION'),
					JsonDecoder.isExactly('GOODWILL')
				],
				''
			),
			description: JsonDecoder.optional(JsonDecoder.string),
			notes: JsonDecoder.optional(JsonDecoder.string),
			award: JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], '')
		},
		'userPoint/'
	);

	'GET:' = JsonDecoder.object<Api.UserPoint.Req.Get>(
		{
			id: JsonDecoder.optional(JsonDecoder.number),
			ids: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, ''))
		},
		'userPoint/'
	);

	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'userPoint/paged');
}
