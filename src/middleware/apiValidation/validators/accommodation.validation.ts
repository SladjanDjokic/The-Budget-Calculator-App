import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class AccommodationValidation extends Validation {
	constructor() {
		super('AccommodationValidation');
	}

	'GET:details' = JsonDecoder.object<Api.Accommodation.Req.Details>(
		{
			accommodationId: JsonDecoder.number
		},
		'accommodation/details'
	);

	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'accommodation/paged');

	'PUT:' = JsonDecoder.object<Api.Accommodation.Req.Update>(
		{
			id: JsonDecoder.number,
			name: JsonDecoder.optional(JsonDecoder.string),
			propertyTypeId: JsonDecoder.optional(JsonDecoder.number),
			shortDescription: JsonDecoder.optional(JsonDecoder.string),
			longDescription: JsonDecoder.optional(JsonDecoder.string),
			bedroomCount: JsonDecoder.optional(JsonDecoder.number),
			bathroomCount: JsonDecoder.optional(JsonDecoder.number),
			address1: JsonDecoder.optional(JsonDecoder.string),
			address2: JsonDecoder.optional(JsonDecoder.string),
			city: JsonDecoder.optional(JsonDecoder.string),
			state: JsonDecoder.optional(JsonDecoder.string),
			zip: JsonDecoder.optional(JsonDecoder.string),
			country: JsonDecoder.optional(JsonDecoder.string),
			status: JsonDecoder.optional(
				JsonDecoder.oneOf<Model.AccommodationStatusType>(
					[
						JsonDecoder.isExactly('ACTIVE'),
						JsonDecoder.isExactly('INACTIVE'),
						JsonDecoder.isExactly('DELETED')
					],
					'status'
				)
			),
			heroUrl: JsonDecoder.optional(JsonDecoder.string),
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
						'mediaIds'
					),
					'mediaIds'
				)
			),
			amenityIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, ''))
		},
		'accommodation/'
	);

	'GET:layout/paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'accommodation/layout/paged');

	'POST:layout' = JsonDecoder.object<Api.AccommodationLayout.Req.Create>(
		{
			accommodationId: JsonDecoder.number,
			title: JsonDecoder.string,
			mediaId: JsonDecoder.number
		},
		'accommodation/layout'
	);

	'GET:availability' = JsonDecoder.object<Api.Accommodation.Req.Availability>(
		{
			pagination: JsonDecoder.object<RedSky.PagePagination>(
				{
					page: JsonDecoder.number,
					perPage: JsonDecoder.number
				},
				'pagination'
			),
			destinationId: JsonDecoder.number,
			startDate: JsonDecoder.string,
			sortOrder: JsonDecoder.oneOf([JsonDecoder.isExactly('ASC'), JsonDecoder.isExactly('DESC')], ''),
			endDate: JsonDecoder.string,
			adultCount: JsonDecoder.number,
			childCount: JsonDecoder.number,
			bedroomCount: JsonDecoder.optional(JsonDecoder.number),
			bathroomCount: JsonDecoder.optional(JsonDecoder.number),
			priceRangeMin: JsonDecoder.optional(JsonDecoder.number),
			priceRangeMax: JsonDecoder.optional(JsonDecoder.number),
			propertyTypeIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, 'propertyTypeIds')),
			experienceIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, '')),
			amenityIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, ''))
		},
		'destination/availability'
	);

	'Post:amenity' = JsonDecoder.object<Api.Amenity.Req.Create>(
		{
			title: JsonDecoder.string,
			icon: JsonDecoder.string
		},
		'accommodation/amenity'
	);

	'Put:amenity' = JsonDecoder.object<Api.Amenity.Req.Update>(
		{
			id: JsonDecoder.number,
			title: JsonDecoder.optional(JsonDecoder.string),
			icon: JsonDecoder.optional(JsonDecoder.string)
		},
		'accommodation/amenity'
	);

	'Delete:amenity' = JsonDecoder.object<Api.Amenity.Req.Delete>(
		{
			id: JsonDecoder.number
		},
		'accommodation/amenity'
	);
}
