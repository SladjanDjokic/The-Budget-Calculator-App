import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class CampaignValidation extends Validation {
	constructor() {
		super('CampaignValidation');
	}

	'POST:' = JsonDecoder.object<Api.Campaign.Req.Create>(
		{
			segmentId: JsonDecoder.optional(JsonDecoder.number),
			name: JsonDecoder.string,
			description: JsonDecoder.optional(JsonDecoder.string),
			isActive: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isActive')
			),
			maxReward: JsonDecoder.number,
			type: JsonDecoder.string,
			startOn: JsonDecoder.string,
			endOn: JsonDecoder.string,
			pointValueMultiplier: JsonDecoder.number,
			activityReferenceNumber: JsonDecoder.optional(JsonDecoder.string),
			actions: JsonDecoder.array(
				JsonDecoder.object<Api.CampaignAction.CreateMany>(
					{
						actionId: JsonDecoder.number,
						actionCount: JsonDecoder.optional(JsonDecoder.number),
						isActive: JsonDecoder.optional(
							JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isActive')
						)
					},
					'actions'
				),
				'action'
			)
		},
		'campaign'
	);

	'GET:' = JsonDecoder.object<Api.Campaign.Req.Get>(
		{
			id: JsonDecoder.optional(JsonDecoder.number),
			ids: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, ''))
		},
		'campaign'
	);

	'GET:paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'campaign/paged');

	'PUT:' = JsonDecoder.object<Api.Campaign.Req.Update>(
		{
			id: JsonDecoder.number,
			segmentId: JsonDecoder.optional(JsonDecoder.number),
			name: JsonDecoder.optional(JsonDecoder.string),
			description: JsonDecoder.optional(JsonDecoder.string),
			isActive: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isActive')
			),
			type: JsonDecoder.optional(JsonDecoder.string),
			maxReward: JsonDecoder.optional(JsonDecoder.number),
			startOn: JsonDecoder.optional(JsonDecoder.string),
			endOn: JsonDecoder.optional(JsonDecoder.string),
			pointValueMultiplier: JsonDecoder.optional(JsonDecoder.number),
			activityReferenceNumber: JsonDecoder.optional(JsonDecoder.string),
			actions: JsonDecoder.optional(
				JsonDecoder.array(
					JsonDecoder.object<Api.CampaignAction.CreateMany>(
						{
							actionId: JsonDecoder.number,
							actionCount: JsonDecoder.optional(JsonDecoder.number),
							isActive: JsonDecoder.optional(
								JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isActive')
							)
						},
						'actions'
					),
					'action'
				)
			)
		},
		'campaign'
	);

	'DELETE:' = JsonDecoder.object<Api.Campaign.Req.Delete>(
		{
			id: JsonDecoder.number
		},
		'campaign'
	);
}
