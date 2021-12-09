import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class RegionValidation extends Validation {
	constructor() {
		super('RegionValidation');
	}

	'POST:' = JsonDecoder.object<Api.Region.Req.Create>(
		{
			name: JsonDecoder.string
		},
		'region'
	);

	'GET:' = JsonDecoder.oneOf([JsonDecoder.objectStrict({}, 'empty object'), JsonDecoder.isNull(null)], 'region');

	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'region/paged');

	'PATCH:' = JsonDecoder.objectStrict<Api.Region.Req.Update>(
		{
			id: JsonDecoder.number,
			name: JsonDecoder.optional(JsonDecoder.string),
			isActive: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isActive')
			)
		},
		'region'
	);
}
