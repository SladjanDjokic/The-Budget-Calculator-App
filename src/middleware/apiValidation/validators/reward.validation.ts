import { JsonDecoder } from 'ts.data.json';
import { Validation } from '../Validation';

export default class RewardValidation extends Validation {
	constructor() {
		super('RewardValidation');
	}

	'POST:' = JsonDecoder.object<Api.Reward.Req.Create>(
		{
			name: JsonDecoder.string,
			description: JsonDecoder.string,
			redemptionInstructions: JsonDecoder.optional(JsonDecoder.string),
			monetaryValueInCents: JsonDecoder.number,
			destinationId: JsonDecoder.optional(JsonDecoder.number),
			brandId: JsonDecoder.optional(JsonDecoder.number),
			pointCost: JsonDecoder.number,
			upc: JsonDecoder.string,
			mediaDetails: JsonDecoder.optional(
				JsonDecoder.array(
					JsonDecoder.object(
						{
							id: JsonDecoder.number,
							isPrimary: JsonDecoder.oneOf(
								[JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)],
								'isPrimary'
							)
						},
						''
					),
					'mediaIds'
				)
			),
			categoryIds: JsonDecoder.array(JsonDecoder.number, 'categoryIds')
		},
		'reward'
	);

	'PUT:' = JsonDecoder.object<Api.Reward.Req.Update>(
		{
			id: JsonDecoder.number,
			name: JsonDecoder.optional(JsonDecoder.string),
			pointCost: JsonDecoder.optional(JsonDecoder.number),
			monetaryValueInCents: JsonDecoder.optional(JsonDecoder.number),
			destinationId: JsonDecoder.optional(JsonDecoder.number),
			brandId: JsonDecoder.optional(JsonDecoder.number),
			description: JsonDecoder.optional(JsonDecoder.string),
			redemptionInstructions: JsonDecoder.optional(JsonDecoder.string),
			upc: JsonDecoder.optional(JsonDecoder.string),
			isActive: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(1), JsonDecoder.isExactly(0)], 'isActive')
			),
			categoryIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, 'categories')),
			mediaDetails: JsonDecoder.optional(
				JsonDecoder.array(
					JsonDecoder.object<Api.MediaDetails>(
						{
							id: JsonDecoder.number,
							isPrimary: JsonDecoder.oneOf(
								[JsonDecoder.isExactly(1), JsonDecoder.isExactly(0)],
								'primary'
							)
						},
						'mediaDetail'
					),
					'mediaDetailArray'
				)
			),
			createdOn: JsonDecoder.optional(JsonDecoder.string),
			modifiedOn: JsonDecoder.optional(JsonDecoder.string)
		},
		'reward'
	);

	'DELETE:' = JsonDecoder.object<Api.Reward.Req.Delete>(
		{
			id: JsonDecoder.number
		},
		'reward'
	);

	'GET:' = JsonDecoder.object<Api.Reward.Req.Get>(
		{
			id: JsonDecoder.optional(JsonDecoder.number),
			ids: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, ''))
		},
		'reward'
	);

	'GET:paged' = JsonDecoder.object<Api.Reward.Req.Paged>(
		{
			...this.pagedValidation
		},
		'reward/paged'
	);

	'GET:customer/paged' = JsonDecoder.object<Api.Reward.Req.CustomerPaged>(
		{
			pagination: JsonDecoder.optional(
				JsonDecoder.object<RedSky.PagePagination>(
					{
						page: JsonDecoder.number,
						perPage: JsonDecoder.number
					},
					'pagination'
				)
			),
			vendorBrandIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, 'vendorBrandIds')),
			vendorDestinationIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, 'vendorDestinationIds')),
			rewardCategoryIds: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, 'rewardCategoryIds')),
			minPointCost: JsonDecoder.optional(JsonDecoder.number),
			maxPointCost: JsonDecoder.optional(JsonDecoder.number)
		},
		'reward/customer/paged'
	);

	'GET:reward/category' = JsonDecoder.object<Api.Reward.Category.Req.Get>(
		{
			id: JsonDecoder.optional(JsonDecoder.number),
			ids: JsonDecoder.optional(JsonDecoder.array(JsonDecoder.number, 'ids'))
		},
		'reward/category'
	);

	'POST:reward/category' = JsonDecoder.object<Api.Reward.Category.Req.Create>(
		{
			name: JsonDecoder.string,
			isActive: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isActive')
			),
			isFeatured: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isFeatured')
			),
			mediaDetails: JsonDecoder.optional(
				JsonDecoder.array(
					JsonDecoder.object<Api.MediaDetails>(
						{
							id: JsonDecoder.number,
							isPrimary: JsonDecoder.oneOf(
								[JsonDecoder.isExactly(1), JsonDecoder.isExactly(0)],
								'primary'
							)
						},
						'mediaDetail'
					),
					'mediaDetailArray'
				)
			)
		},
		'reward/category'
	);

	'PUT:reward/category' = JsonDecoder.object<Api.Reward.Category.Req.Update>(
		{
			id: JsonDecoder.number,
			name: JsonDecoder.string,
			isActive: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isActive')
			),
			isFeatured: JsonDecoder.optional(
				JsonDecoder.oneOf([JsonDecoder.isExactly(0), JsonDecoder.isExactly(1)], 'isFeatured')
			),
			mediaDetails: JsonDecoder.optional(
				JsonDecoder.array(
					JsonDecoder.object<Api.MediaDetails>(
						{
							id: JsonDecoder.number,
							isPrimary: JsonDecoder.oneOf(
								[JsonDecoder.isExactly(1), JsonDecoder.isExactly(0)],
								'primary'
							)
						},
						'mediaDetail'
					),
					'mediaDetailArray'
				)
			)
		},
		'reward/category'
	);

	'GET:category/paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'reward/category/paged');

	'POST:voucher' = JsonDecoder.object<Api.Reward.Voucher.Req.Create>(
		{
			rewardId: JsonDecoder.number,
			codes: JsonDecoder.array(JsonDecoder.string, 'voucherCodes')
		},
		'reward/voucher'
	);

	'GET:voucher/paged' = JsonDecoder.object<RedSky.PageQuery>(this.pagedValidation, 'reward/voucher/paged');

	'DELETE:voucher' = JsonDecoder.object<Api.Reward.Voucher.Req.Delete>(
		{
			rewardId: JsonDecoder.number,
			code: JsonDecoder.oneOf<string | number>([JsonDecoder.string, JsonDecoder.number], 'code')
		},
		'reward/voucher'
	);

	'PUT:voucher/claim' = JsonDecoder.object<Api.Reward.Voucher.Req.Claim>(
		{
			rewardId: JsonDecoder.number,
			code: JsonDecoder.string
		},
		'reward/voucher/claim'
	);
}
