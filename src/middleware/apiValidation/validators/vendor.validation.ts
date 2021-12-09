import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class VendorValidation extends Validation {
	constructor() {
		super('VendorValidation');
	}

	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'vendor/paged');
}
