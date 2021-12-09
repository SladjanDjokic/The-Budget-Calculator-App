import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class CompanyValidation extends Validation {
	constructor() {
		super('CompanyValidation');
	}

	'GET:' = JsonDecoder.object<Api.Company.Req.Get>(
		{
			id: JsonDecoder.optional(JsonDecoder.number),
			ids: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, ''))
		},
		'company/'
	);

	'POST:' = JsonDecoder.objectStrict<Api.Company.Req.Create>(
		{
			name: JsonDecoder.string,
			newAdminEmail: JsonDecoder.string,
			newAdminPassword: JsonDecoder.string,
			address: JsonDecoder.optional(JsonDecoder.string),
			city: JsonDecoder.optional(JsonDecoder.string),
			country: JsonDecoder.optional(JsonDecoder.string),
			description: JsonDecoder.optional(JsonDecoder.string),
			privacyPolicyUrl: JsonDecoder.optional(JsonDecoder.string),
			returnPolicyUrl: JsonDecoder.optional(JsonDecoder.string),
			squareLogoUrl: JsonDecoder.optional(JsonDecoder.string),
			state: JsonDecoder.optional(JsonDecoder.string),
			termsConditionsUrl: JsonDecoder.optional(JsonDecoder.string),
			vanityUrls: JsonDecoder.array<string>(JsonDecoder.string, ''),
			wideLogoUrl: JsonDecoder.optional(JsonDecoder.string),
			zip: JsonDecoder.optional(JsonDecoder.string)
		},
		'company/create'
	);

	'PUT:' = JsonDecoder.objectStrict<Api.Company.Req.Update>(
		{
			id: JsonDecoder.number,
			address: JsonDecoder.optional(JsonDecoder.string),
			city: JsonDecoder.optional(JsonDecoder.string),
			country: JsonDecoder.optional(JsonDecoder.string),
			description: JsonDecoder.optional(JsonDecoder.string),
			name: JsonDecoder.optional(JsonDecoder.string),
			privacyPolicyUrl: JsonDecoder.optional(JsonDecoder.string),
			returnPolicyUrl: JsonDecoder.optional(JsonDecoder.string),
			squareLogoUrl: JsonDecoder.optional(JsonDecoder.string),
			state: JsonDecoder.optional(JsonDecoder.string),
			termsConditionsUrl: JsonDecoder.optional(JsonDecoder.string),
			vanityUrls: JsonDecoder.optional(JsonDecoder.array<string>(JsonDecoder.string, '')),
			wideLogoUrl: JsonDecoder.optional(JsonDecoder.string),
			zip: JsonDecoder.optional(JsonDecoder.string)
		},
		'company/update'
	);

	'PUT:unauthorized-pages' = JsonDecoder.objectStrict<Api.Company.Req.UpdateUnauthorizedPages>(
		{
			unauthorizedPages: JsonDecoder.array(
				JsonDecoder.objectStrict<Model.PageGuard>(
					{
						page: JsonDecoder.string,
						route: JsonDecoder.string,
						reRoute: JsonDecoder.string,
						isActive: JsonDecoder.oneOf([JsonDecoder.isExactly(1), JsonDecoder.isExactly(0)], 'isActive')
					},
					'PageGuard'
				),
				'unathorizedPages'
			)
		},
		'company/unauthorized-pages'
	);

	'PUT:available-pages' = JsonDecoder.objectStrict<Api.Company.Req.UpdateAvailablePages>(
		{
			availablePages: JsonDecoder.array(
				JsonDecoder.objectStrict<Model.PageGuard>(
					{
						page: JsonDecoder.string,
						route: JsonDecoder.string,
						reRoute: JsonDecoder.string,
						isActive: JsonDecoder.oneOf([JsonDecoder.isExactly(1), JsonDecoder.isExactly(0)], 'isActive')
					},
					'PageGuard'
				),
				'availablePages'
			)
		},
		'company/available-pages'
	);
}