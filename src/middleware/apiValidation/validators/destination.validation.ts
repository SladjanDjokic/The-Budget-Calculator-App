import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class DestinationValidation extends Validation {
	constructor() {
		super('DestinationValidation');
	}

	'GET:' = JsonDecoder.object<Api.Destination.Req.Get>(
		{
			id: JsonDecoder.optional(JsonDecoder.number),
			ids: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, ''))
		},
		'destination/'
	);

	'GET:accommodationType' = JsonDecoder.object<Api.Destination.Req.AccommodationType>(
		{
			destinationId: JsonDecoder.optional(JsonDecoder.number),
			destinationIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, ''))
		},
		'destination/accommodationType/'
	);

	'GET:propertyType' = JsonDecoder.object<Api.Destination.Req.PropertyType>(
		{ destinationId: JsonDecoder.number },
		'destination/propertyType'
	);

	// 'Get:allPropertyTypes' = JsonDecoder.object<null>(null, 'destination/allPropertyTypes');

	'GET:details' = JsonDecoder.object<Api.Destination.Req.Details>(
		{
			destinationId: JsonDecoder.number,
			startDate: JsonDecoder.optional(JsonDecoder.string),
			endDate: JsonDecoder.optional(JsonDecoder.string)
		},
		'destination/details'
	);

	'PUT:' = JsonDecoder.object<Api.Destination.Req.Update>(
		{
			id: JsonDecoder.number,
			description: JsonDecoder.optional(JsonDecoder.string),
			locationDescription: JsonDecoder.optional(JsonDecoder.string),
			propertyTypeIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, 'propertyTypeIds')),
			regionIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, 'regionIds')),
			status: JsonDecoder.optional(JsonDecoder.string),
			address1: JsonDecoder.optional(JsonDecoder.string),
			address2: JsonDecoder.optional(JsonDecoder.string),
			city: JsonDecoder.optional(JsonDecoder.string),
			state: JsonDecoder.optional(JsonDecoder.string),
			zip: JsonDecoder.optional(JsonDecoder.string),
			country: JsonDecoder.optional(JsonDecoder.string),
			logoUrl: JsonDecoder.optional(JsonDecoder.string),
			heroUrl: JsonDecoder.optional(JsonDecoder.string),
			mediaIds: JsonDecoder.optional(
				JsonDecoder.array(
					JsonDecoder.object<Api.MediaDetails>(
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
			isActive: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isActive')
			),
			loyaltyStatus: JsonDecoder.optional(
				JsonDecoder.oneOf(
					[
						JsonDecoder.isExactly('PENDING'),
						JsonDecoder.isExactly('ACTIVE'),
						JsonDecoder.isExactly('FROZEN')
					],
					''
				)
			)
		},
		'destination/'
	);

	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'destination/paged');

	'GET:availability' = JsonDecoder.object<Api.Destination.Req.Availability>(
		{
			pagination: JsonDecoder.object<RedSky.PagePagination>(
				{
					page: JsonDecoder.number,
					perPage: JsonDecoder.number
				},
				'pagination'
			),
			startDate: JsonDecoder.string,
			endDate: JsonDecoder.string,
			adultCount: JsonDecoder.number,
			childCount: JsonDecoder.number,
			sortOrder: JsonDecoder.oneOf([JsonDecoder.isExactly('ASC'), JsonDecoder.isExactly('DESC')], ''),
			priceRangeMin: JsonDecoder.optional(JsonDecoder.number),
			priceRangeMax: JsonDecoder.optional(JsonDecoder.number),
			propertyTypeIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, 'propertyTypeIds')),
			experienceIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, '')),
			amenityIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, '')),
			regionIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, 'regionIds')),
			bedroomCount: JsonDecoder.optional(JsonDecoder.number),
			bathroomCount: JsonDecoder.optional(JsonDecoder.number)
		},
		'destination/availability'
	);
}
