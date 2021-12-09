import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class ReviewValidation extends Validation {
	constructor() {
		super('ReviewValidation');
	}

	'GET:paged' = JsonDecoder.objectStrict<RedSky.PageQuery>(this.pagedValidation, 'review/paged');

	'GET:' = JsonDecoder.objectStrict<Api.Review.Req.Get>(
		{
			id: JsonDecoder.number
		},
		'review'
	);

	'GET:for-user' = JsonDecoder.objectStrict<Api.Review.Req.ForUser>(
		{
			userId: JsonDecoder.number
		},
		'review/for-user'
	);

	'GET:for-destination' = JsonDecoder.objectStrict<Api.Review.Req.ForDestination>(
		{
			destinationId: JsonDecoder.number
		},
		'review/for-destination'
	);

	'POST:' = JsonDecoder.objectStrict<Api.Review.Req.Create>(
		{
			reservationId: JsonDecoder.number,
			message: JsonDecoder.string,
			rating: JsonDecoder.number
		},
		'review'
	);

	'PUT:' = JsonDecoder.objectStrict<Api.Review.Req.Update>(
		{
			id: JsonDecoder.number,
			message: JsonDecoder.optional(JsonDecoder.string),
			rating: JsonDecoder.optional(JsonDecoder.number)
		},
		'review'
	);

	'PUT:verify' = JsonDecoder.objectStrict<Api.Review.Req.Verify>(
		{
			reviewId: JsonDecoder.number
		},
		'review/verify'
	);

	'PUT:un-publish' = JsonDecoder.objectStrict<Api.Review.Req.UnPublish>(
		{
			reviewId: JsonDecoder.number
		},
		'review/un-publish'
	);

	'PUT:publish' = JsonDecoder.objectStrict<Api.Review.Req.Publish>(
		{
			reviewId: JsonDecoder.number
		},
		'review/publish'
	);

	'DELETE:' = JsonDecoder.objectStrict<Api.Review.Req.Delete>(
		{
			id: JsonDecoder.number
		},
		'review'
	);
}
