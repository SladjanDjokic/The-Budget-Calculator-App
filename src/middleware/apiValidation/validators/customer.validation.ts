import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class CustomerValidation extends Validation {
	constructor() {
		super('CustomerValidation');
	}

	'POST:' = JsonDecoder.object<Api.Customer.Req.Create>(
		{
			name: JsonDecoder.string,
			primaryEmail: JsonDecoder.string,
			password: JsonDecoder.string
		},
		'customer/'
	);

	'GET:' = JsonDecoder.object<Api.Customer.Req.Get>({}, 'customer/');
}
