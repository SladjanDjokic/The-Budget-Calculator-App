import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class CountryValidation extends Validation {
	constructor() {
		super('CountryValidation');
	}

	'GET:' = JsonDecoder.object<Api.Country.Req.Country>(
		{
			countryCode: JsonDecoder.string
		},
		'country/'
	);

	'GET:states' = JsonDecoder.object<Api.Country.Req.States>(
		{
			countryCode: JsonDecoder.string
		},
		'country/states'
	);

	'GET:cities' = JsonDecoder.object<Api.Country.Req.Cities>(
		{
			countryCode: JsonDecoder.string,
			stateCode: JsonDecoder.string
		},
		'country/cities'
	);
}
