import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class DestinationValidation extends Validation {
	constructor() {
		super('ExperienceValidation');
	}

	'POST:' = JsonDecoder.object<Api.Experience.Req.Create>(
		{
			title: JsonDecoder.string,
			icon: JsonDecoder.string
		},
		'experience'
	);

	'PUT:' = JsonDecoder.object<Api.Experience.Req.Update>(
		{
			id: JsonDecoder.number,
			title: JsonDecoder.optional(JsonDecoder.string),
			icon: JsonDecoder.optional(JsonDecoder.string)
		},
		'experience'
	);

	'DELETE:' = JsonDecoder.object<Api.Experience.Req.Delete>(
		{
			id: JsonDecoder.optional(JsonDecoder.number),
			ids: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, ''))
		},
		'experience'
	);

	'POST:destination' = JsonDecoder.object<Api.Experience.Req.CreateDestinationExperience>(
		{
			destinationId: JsonDecoder.number,
			experienceId: JsonDecoder.number,
			description: JsonDecoder.string,
			isHighlighted: JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isHighlighted'),
			media: JsonDecoder.array(
				JsonDecoder.object<Omit<Api.Media, 'urls' | 'companyId' | 'uploaderId' | 'type'>>(
					{
						id: JsonDecoder.number,
						isPrimary: JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], ''),
						title: JsonDecoder.string,
						description: JsonDecoder.string
					},
					''
				),
				''
			)
		},
		'experience/destination'
	);

	'PUT:destination' = JsonDecoder.object<Api.Experience.Req.UpdateDestinationExperience>(
		{
			destinationExperienceId: JsonDecoder.number,
			destinationId: JsonDecoder.number,
			experienceId: JsonDecoder.number,
			description: JsonDecoder.string,
			isHighlighted: JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isHighlighted'),
			media: JsonDecoder.array(
				JsonDecoder.object<Omit<Api.Media, 'urls' | 'companyId' | 'uploaderId' | 'type'>>(
					{
						id: JsonDecoder.number,
						isPrimary: JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], ''),
						title: JsonDecoder.string,
						description: JsonDecoder.string
					},
					''
				),
				''
			)
		},
		'experience/destination'
	);

	'DELETE:destination' = JsonDecoder.object<Api.Experience.Req.Delete>(
		{
			id: JsonDecoder.optional(JsonDecoder.number),
			ids: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, ''))
		},
		'experience/destination'
	);
}
