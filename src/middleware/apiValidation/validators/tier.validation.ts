import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class TierValidation extends Validation {
	constructor() {
		super('TierValidation');
	}

	'POST:' = JsonDecoder.object<Api.Tier.Req.Create>(
		{
			name: JsonDecoder.string,
			description: JsonDecoder.optional(JsonDecoder.string),
			accrualRate: JsonDecoder.number,
			threshold: JsonDecoder.number,
			featureIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, 'featureIds')),
			isAnnualRate: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], '')
			),
			mediaDetails: JsonDecoder.optional(
				JsonDecoder.array(
					JsonDecoder.object(
						{
							id: JsonDecoder.number,
							isPrimary: JsonDecoder.oneOf(
								[JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)],
								'isPrimary'
							)
						},
						'mediaDetails'
					),
					'mediaDetailsArray'
				)
			)
		},
		'tier/'
	);

	'GET:' = JsonDecoder.object<Api.Tier.Req.Get>(
		{
			id: JsonDecoder.number
		},
		'tier/'
	);

	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'tier/paged');

	'PUT:' = JsonDecoder.object<Api.Tier.Req.Update>(
		{
			id: JsonDecoder.number,
			name: JsonDecoder.optional(JsonDecoder.string),
			description: JsonDecoder.optional(JsonDecoder.string),
			isActive: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isActive')
			),
			accrualRate: JsonDecoder.optional(JsonDecoder.number),
			threshold: JsonDecoder.optional(JsonDecoder.number),
			featureIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, 'featureIds')),
			isAnnualRate: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], '')
			),
			mediaDetails: JsonDecoder.optional(
				JsonDecoder.array(
					JsonDecoder.object(
						{
							id: JsonDecoder.number,
							isPrimary: JsonDecoder.oneOf(
								[JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)],
								'isPrimary'
							)
						},
						''
					),
					'mediaIds'
				)
			)
		},
		'tier/'
	);

	'DELETE:' = JsonDecoder.object<Api.Tier.Req.Delete>(
		{
			id: JsonDecoder.number
		},
		'tier/'
	);

	'DELETE:/feature' = JsonDecoder.object<Api.Tier.Req.Delete>(
		{
			id: JsonDecoder.number
		},
		'tier/feature'
	);

	'POST:/feature' = JsonDecoder.object<Api.Tier.Req.CreateFeature>(
		{
			name: JsonDecoder.string
		},
		'tier/feature'
	);

	'GET:/feature' = JsonDecoder.object<Api.Tier.Req.GetFeature>({ id: JsonDecoder.number }, 'tier/feature');

	'PUT:/feature' = JsonDecoder.object<Api.Tier.Req.UpdateFeature>(
		{
			id: JsonDecoder.number,
			name: JsonDecoder.string
		},
		'tier/feature'
	);
}
