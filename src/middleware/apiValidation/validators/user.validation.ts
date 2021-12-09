import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class UserValidation extends Validation {
	constructor() {
		super('UserValidation');
	}

	'POST:' = JsonDecoder.object<Api.User.Req.Create>(
		{
			userRoleId: JsonDecoder.optional(JsonDecoder.number),
			firstName: JsonDecoder.string,
			lastName: JsonDecoder.string,
			primaryEmail: JsonDecoder.string,
			password: JsonDecoder.string,
			phone: JsonDecoder.optional(JsonDecoder.string),
			birthDate: JsonDecoder.optional(JsonDecoder.string),
			address: JsonDecoder.optional(
				JsonDecoder.object<Api.UserAddress.Req.Create>(
					{
						name: JsonDecoder.optional(JsonDecoder.string),
						userId: JsonDecoder.optional(JsonDecoder.number),
						type: JsonDecoder.oneOf(
							[
								JsonDecoder.isExactly('SHIPPING'),
								JsonDecoder.isExactly('BILLING'),
								JsonDecoder.isExactly('BOTH')
							],
							''
						),
						address1: JsonDecoder.string,
						address2: JsonDecoder.optional(JsonDecoder.string),
						city: JsonDecoder.optional(JsonDecoder.string),
						state: JsonDecoder.string,
						zip: JsonDecoder.number,
						country: JsonDecoder.string,
						isDefault: JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isDefault')
					},
					'address'
				)
			),
			emailNotification: JsonDecoder.optional(Validation.bitDecoder)
		},
		'user/'
	);

	'PUT:' = JsonDecoder.object<Api.User.Req.Update>(
		{
			id: JsonDecoder.optional(JsonDecoder.number),
			ids: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, '')),
			userRoleId: JsonDecoder.optional(JsonDecoder.number),
			firstName: JsonDecoder.optional(JsonDecoder.string),
			permissionLogin: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], '')
			),
			lastName: JsonDecoder.optional(JsonDecoder.string),
			primaryEmail: JsonDecoder.optional(JsonDecoder.string),
			phone: JsonDecoder.optional(JsonDecoder.string),
			birthDate: JsonDecoder.optional(JsonDecoder.string),
			allowEmailNotification: JsonDecoder.optional(Validation.bitDecoder)
		},
		'user/'
	);

	'DELETE:' = JsonDecoder.object<Api.User.Req.Delete>(
		{
			id: JsonDecoder.optional(JsonDecoder.number),
			ids: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, ''))
		},
		'user/'
	);

	'PUT:user/reactivate' = JsonDecoder.object<{ id: number }>({ id: JsonDecoder.number }, 'user/reactivate');

	'POST:login' = JsonDecoder.object<Api.User.Req.Login>(
		{
			username: JsonDecoder.string,
			password: JsonDecoder.string
		},
		'user/login'
	);

	'POST:password/forgot' = JsonDecoder.object<Api.User.Req.ForgotPassword>(
		{
			primaryEmail: JsonDecoder.string
		},
		'user/password/forgot'
	);

	'PUT:password/guid/valid' = JsonDecoder.object<Api.User.Req.ValidateGuid>(
		{
			guid: JsonDecoder.string
		},
		'user/password/guid/valid'
	);

	'PUT:password/reset' = JsonDecoder.object<Api.User.Req.ResetPassword>(
		{
			passwordResetGuid: JsonDecoder.string,
			newPassword: JsonDecoder.string
		},
		'user/password/reset'
	);

	'PUT:password' = JsonDecoder.object<Api.User.Req.UpdatePassword>(
		{
			old: JsonDecoder.string,
			new: JsonDecoder.string
		},
		'user/password'
	);

	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'user/paged');

	'GET:points' = JsonDecoder.object<Api.User.Req.UserPoints>(
		{
			userId: JsonDecoder.optional(JsonDecoder.number)
		},
		'user/points'
	);

	'GET:email' = JsonDecoder.object<Api.User.Req.UserEmail>(
		{
			primaryEmail: JsonDecoder.string
		},
		'user/email'
	);
}
