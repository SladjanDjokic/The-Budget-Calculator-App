import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class ActionValidation extends Validation {
	constructor() {
		super('ActionValidation');
	}

	'POST:' = JsonDecoder.object<Api.Action.Req.Create>(
		{
			name: JsonDecoder.string,
			description: JsonDecoder.optional(JsonDecoder.string),
			brandId: JsonDecoder.optional(JsonDecoder.number),
			brandLocationId: JsonDecoder.optional(JsonDecoder.number),
			isActive: JsonDecoder.optional(Validation.bitDecoder),
			type: JsonDecoder.string,
			pointValue: JsonDecoder.number
		},
		'action'
	);

	'GET:' = JsonDecoder.object<Api.Action.Req.Get>(
		{
			id: JsonDecoder.optional(JsonDecoder.number),
			ids: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, ''))
		},
		'action'
	);

	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'action/paged');

	'PUT:' = JsonDecoder.object<Api.Action.Req.Update>(
		{
			id: JsonDecoder.number,
			name: JsonDecoder.optional(JsonDecoder.string),
			description: JsonDecoder.optional(JsonDecoder.string),
			brandId: JsonDecoder.optional(JsonDecoder.number),
			brandLocationId: JsonDecoder.optional(JsonDecoder.number),
			isActive: JsonDecoder.optional(Validation.bitDecoder),
			type: JsonDecoder.optional(JsonDecoder.string),
			pointValue: JsonDecoder.optional(JsonDecoder.number)
		},
		'action'
	);

	'DELETE:' = JsonDecoder.object<Api.Action.Req.Delete>(
		{
			id: JsonDecoder.number
		},
		'action'
	);

	'POST:fulfill' = JsonDecoder.object<Api.Action.Req.Fulfill>(
		{
			actionId: JsonDecoder.number
		},
		'action/fulfill'
	);
}
