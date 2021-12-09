import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class PackageValidation extends Validation {
	constructor() {
		super('PackageValidation');
	}

	'PUT' = JsonDecoder.objectStrict<Api.UpsellPackage.Req.Update>(
		{
			id: JsonDecoder.number,
			title: JsonDecoder.optional(JsonDecoder.string),
			description: JsonDecoder.optional(JsonDecoder.string),
			isActive: JsonDecoder.optional(Validation.bitDecoder),
			startDate: JsonDecoder.optional(JsonDecoder.string),
			endDate: JsonDecoder.optional(JsonDecoder.string),
			mediaIds: JsonDecoder.optional(
				JsonDecoder.array(
					JsonDecoder.object<Api.MediaDetails>(
						{
							id: JsonDecoder.number,
							isPrimary: JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], '')
						},
						''
					),
					''
				)
			)
		},
		'package/'
	);

	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'package/paged');

	'GET:availability' = JsonDecoder.object<Api.UpsellPackage.Req.Availability>(
		{
			destinationId: JsonDecoder.number,
			packageIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, '')),
			excludePackageIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, '')),
			startDate: JsonDecoder.string,
			endDate: JsonDecoder.string,
			pagination: JsonDecoder.optional(
				JsonDecoder.object<RedSky.PagePagination>(
					{
						page: JsonDecoder.number,
						perPage: JsonDecoder.number
					},
					'pagination'
				)
			)
		},
		'package/availability'
	);
}
