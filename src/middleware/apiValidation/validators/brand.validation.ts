import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class BrandValidation extends Validation {
	constructor() {
		super('CompanyValidation');
	}

	'GET:' = JsonDecoder.object<Api.Brand.Req.Get>(
		{
			id: JsonDecoder.number
		},
		'brand/details'
	);

	'GET:location' = JsonDecoder.object<Api.Brand.Req.Location.Get>(
		{
			id: JsonDecoder.number
		},
		'brand/location'
	);

	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'brand/paged');

	'PATCH:' = JsonDecoder.object<Api.Brand.Req.Update>(
		{
			companyId: JsonDecoder.optional(JsonDecoder.number),
			description: JsonDecoder.optional(JsonDecoder.string),
			id: JsonDecoder.number,
			metaData: JsonDecoder.optional(JsonDecoder.string),
			name: JsonDecoder.optional(JsonDecoder.string),
			squareLogoUrl: JsonDecoder.optional(JsonDecoder.string),
			website: JsonDecoder.optional(JsonDecoder.string),
			wideLogoUrl: JsonDecoder.optional(JsonDecoder.string),
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
					'loyalty status'
				)
			)
		},
		'brand'
	);

	'GET:reports' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'brand/reports');

	'GET:location/transactions' = JsonDecoder.object<Api.Brand.Req.Location.Report>(
		{
			id: JsonDecoder.number,
			pageQuery: JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'pageQuery')
		},
		'brand/location/transactions'
	);

	'GET:location/details' = JsonDecoder.object<Api.Brand.Req.Location.Get>(
		{
			id: JsonDecoder.number
		},
		'brand/location/details'
	);

	'GET:location/paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'brand/location/paged');

	'GET:location/reports' = JsonDecoder.object<Api.Brand.Req.Report>(
		{
			id: JsonDecoder.number,
			pageQuery: JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'pageQuery')
		},
		'brand/location/reports'
	);

	'GET:location/reports/export' = JsonDecoder.object<Api.Brand.Req.Get>(
		{
			id: JsonDecoder.number
		},
		'brand/location/reports/export'
	);

	'PATCH:location' = JsonDecoder.object<Api.Brand.Req.Location.Update>(
		{
			address1: JsonDecoder.optional(JsonDecoder.string),
			address2: JsonDecoder.optional(JsonDecoder.string),
			city: JsonDecoder.optional(JsonDecoder.string),
			country: JsonDecoder.optional(JsonDecoder.string),
			id: JsonDecoder.number,
			isActive: JsonDecoder.optional(JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], '')),
			metaData: JsonDecoder.optional(JsonDecoder.string),
			name: JsonDecoder.optional(JsonDecoder.string),
			state: JsonDecoder.optional(JsonDecoder.string),
			zip: JsonDecoder.optional(JsonDecoder.string),
			loyaltyStatus: JsonDecoder.optional(
				JsonDecoder.oneOf(
					[
						JsonDecoder.isExactly('PENDING'),
						JsonDecoder.isExactly('ACTIVE'),
						JsonDecoder.isExactly('FROZEN')
					],
					'loyalty status'
				)
			)
		},
		'brand/location'
	);
}
