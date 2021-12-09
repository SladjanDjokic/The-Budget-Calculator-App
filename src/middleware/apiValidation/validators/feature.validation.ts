import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class FeatureValidation extends Validation {
	constructor() {
		super('FeatureValidation');
	}

	'POST:' = JsonDecoder.object<Api.Feature.Req.Create>(
		{
			brandId: JsonDecoder.optional(JsonDecoder.number),
			destinationId: JsonDecoder.optional(JsonDecoder.number),
			accommodationId: JsonDecoder.optional(JsonDecoder.number),
			accommodationCategoryId: JsonDecoder.optional(JsonDecoder.number),
			title: JsonDecoder.optional(JsonDecoder.string),
			description: JsonDecoder.optional(JsonDecoder.string),
			mediaIds: JsonDecoder.optional(
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
			),
			icon: JsonDecoder.optional(JsonDecoder.string),
			isActive: JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isActive'),
			isCarousel: JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isCarousel')
		},
		'feature/'
	);

	'PUT' = JsonDecoder.object<Api.Feature.Req.Update>(
		{
			id: JsonDecoder.number,
			title: JsonDecoder.optional(JsonDecoder.string),
			description: JsonDecoder.optional(JsonDecoder.string),
			mediaIds: JsonDecoder.optional(
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
			),
			icon: JsonDecoder.optional(JsonDecoder.string),
			isActive: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isActive')
			),
			isCarousel: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isCarousel')
			)
		},
		'feature/'
	);

	'GET:' = JsonDecoder.object<Api.Feature.Req.Get>(
		{
			id: JsonDecoder.optional(JsonDecoder.number),
			ids: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, 'ids'))
		},
		'feature/'
	);

	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'feature/paged');

	'DELETE:' = JsonDecoder.object<Api.Feature.Req.Delete>(
		{
			id: JsonDecoder.optional(JsonDecoder.number),
			ids: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, 'ids'))
		},
		'feature/'
	);
}
