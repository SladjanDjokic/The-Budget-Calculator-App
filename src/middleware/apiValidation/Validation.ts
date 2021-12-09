import { JsonDecoder } from 'ts.data.json';
import validationFactory from './ValidationFactory';

export class Validation {
	public name;
	constructor(name: string) {
		this.name = name;
		validationFactory.register(this, this.name);
	}

	protected static readonly bitDecoder = JsonDecoder.oneOf<0 | 1>(
		[JsonDecoder.isExactly(1), JsonDecoder.isExactly(0)],
		'bit'
	);

	protected readonly pagedValidation = {
		pagination: JsonDecoder.optional(
			JsonDecoder.object<RedSky.PagePagination>(
				{
					page: JsonDecoder.number,
					perPage: JsonDecoder.number
				},
				'pagination'
			)
		),
		sort: JsonDecoder.optional(
			JsonDecoder.object<RedSky.SortQuery>(
				{
					field: JsonDecoder.string,
					order: JsonDecoder.oneOf(
						[
							JsonDecoder.isExactly('ASC'),
							JsonDecoder.isExactly('DESC'),
							JsonDecoder.isExactly('RAND'),
							JsonDecoder.isExactly('NONE')
						],
						'order'
					)
				},
				'sort'
			)
		),
		filter: JsonDecoder.optional(
			JsonDecoder.object<RedSky.FilterQuery>(
				{
					matchType: JsonDecoder.oneOf(
						[
							JsonDecoder.isExactly('exact'),
							JsonDecoder.isExactly('fuzzy'),
							JsonDecoder.isExactly('like'),
							JsonDecoder.isExactly('greaterThan'),
							JsonDecoder.isExactly('greaterThanEqual'),
							JsonDecoder.isExactly('lessThan'),
							JsonDecoder.isExactly('lessThanEqual')
						],
						'matchType'
					),
					searchTerm: JsonDecoder.array(
						JsonDecoder.object<RedSky.FilterQueryValue>(
							{
								column: JsonDecoder.string,
								value: JsonDecoder.oneOf<string | string[] | number | number[]>(
									[
										JsonDecoder.string,
										JsonDecoder.array(JsonDecoder.string, ''),
										JsonDecoder.number,
										JsonDecoder.array(JsonDecoder.number, '')
									],
									'searchTerm.value'
								),
								conjunction: JsonDecoder.optional(
									JsonDecoder.oneOf(
										[JsonDecoder.isExactly('AND'), JsonDecoder.isExactly('OR')],
										'conjunction'
									)
								),
								matchType: JsonDecoder.optional(
									JsonDecoder.oneOf(
										[
											JsonDecoder.isExactly('exact'),
											JsonDecoder.isExactly('fuzzy'),
											JsonDecoder.isExactly('like'),
											JsonDecoder.isExactly('greaterThan'),
											JsonDecoder.isExactly('greaterThanEqual'),
											JsonDecoder.isExactly('lessThan'),
											JsonDecoder.isExactly('lessThanEqual')
										],
										'matchType'
									)
								)
							},
							'matchType'
						),
						'searchTerm'
					)
				},
				'filter'
			)
		)
	};
}
