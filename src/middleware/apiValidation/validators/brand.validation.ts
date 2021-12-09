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

	'GET:location' = JsonDecoder.object<Api.Brand.Req.Location>(
		{
			id: JsonDecoder.number
		},
		'brand/location'
	);

	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'brand/paged');

	'GET:location/details' = JsonDecoder.object<Api.Brand.Req.Location.Get>(
		{
			id: JsonDecoder.number
		},
		'brand/location/details'
	);

	'GET:location/paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'brand/location/paged');
}
