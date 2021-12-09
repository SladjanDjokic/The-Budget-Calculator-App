import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class MediaValidation extends Validation {
	constructor() {
		super('MediaValidation');
	}

	'GET:' = JsonDecoder.object<Api.Media.Req.Get>(
		{
			id: JsonDecoder.optional(JsonDecoder.number),
			ids: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, 'ids'))
		},
		'media/'
	);

	// Multi-part form data is only parsed by multer. Thus these endpoints need to do their own validation
	'POST:image/create/pyramid' = JsonDecoder.succeed;

	'PUT:' = JsonDecoder.object<Api.Media.Req.Update>(
		{
			id: JsonDecoder.number,
			description: JsonDecoder.optional(JsonDecoder.string),
			title: JsonDecoder.optional(JsonDecoder.string),
			isPrimary: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isPrimary')
			)
		},
		'media/'
	);
}
