import mysql from 'mysql';
import { ObjectUtils } from '../../utils/utils';
import IRewardCategoryTable from '../interfaces/IRewardCategoryTable';
import Table from '../Table';

export default class RewardCategoryTable extends Table implements IRewardCategoryTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async deactivate(categoryId: number): Promise<number> {
		const result = await this.db.runQuery(
			`UPDATE ${this.tableName}
			SET isActive=FALSE,
				modifiedOn=CURRENT_TIMESTAMP
			WHERE id=?;`,
			[categoryId]
		);
		if (result.affectedRows > 0) return categoryId;
	}

	async getById(id: number): Promise<Api.Reward.Category.Res.Get> {
		return await this.db.queryOne(
			`SELECT 
				rewardCategory.*,
				IFNULL(rewardCategoryMedia.media, '${Table.mediaNotFoundObject}') AS media
			FROM rewardCategory
			LEFT JOIN(
				SELECT mediaMap.rewardCategoryId,
					CONCAT(
						'[',
						GROUP_CONCAT(
							CONCAT(
								'{"id":', id,
								',"uploaderId":', uploaderId,
								',"type":"', type,
								'","urls":', urls,
								',"title":"', IFNULL(title, ''),
								'","description":"', IFNULL(description, ''),
								'","isPrimary":', isPrimary, '}'
							)
						),
						']'
					) media
				FROM media
					JOIN mediaMap ON mediaMap.mediaId = media.id
				GROUP BY mediaMap.rewardCategoryId
			) rewardCategoryMedia ON rewardCategoryMedia.rewardCategoryId = rewardCategory.id
			WHERE rewardCategory.id=?;`,
			[id]
		);
	}

	async getManyByIds(ids: number[]): Promise<Api.Reward.Category.Res.Get[]> {
		return await this.db.runQuery(
			`SELECT
			rewardCategory.*,
			IFNULL(rewardCategoryMedia.media, '${Table.mediaNotFoundObject}') AS media
		FROM rewardCategory
				 LEFT JOIN(
			SELECT mediaMap.rewardCategoryId,
				   CONCAT(
						   '[',
						   GROUP_CONCAT(
								   CONCAT(
										   '{"id":', id,
										   ',"uploaderId":', uploaderId,
										   ',"type":"', type,
										   '","urls":', urls,
										   ',"title":"', IFNULL(title, ''),
										   '","description":"', IFNULL(description, ''),
										   '","isPrimary":', isPrimary, '}'
									   )
							   ),
						   ']'
					   ) media
			FROM media
					 JOIN mediaMap ON mediaMap.mediaId = media.id
			GROUP BY mediaMap.rewardCategoryId
		) rewardCategoryMedia ON rewardCategoryMedia.rewardCategoryId = rewardCategory.id
		WHERE
			 rewardCategory.id IN (?);`,
			[ids]
		);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	): Promise<RedSky.RsPagedResponseData<Api.Reward.Category.Res.Get[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		let allObjects = await this.db.runQuery(
			`SELECT 
				rewardCategory.*,
				IFNULL(rewardCategoryMedia.media, '${Table.mediaNotFoundObject}') AS media
			 FROM rewardCategory
				LEFT JOIN(
					SELECT mediaMap.rewardCategoryId,
						CONCAT(
							'[',
							GROUP_CONCAT(
								CONCAT(
									'{"id":', id,
									',"uploaderId":', uploaderId,
									',"type":"', type,
									'","urls":', urls,
									',"title":"', IFNULL(title, ''),
									'","description":"', IFNULL(description, ''),
									'","isPrimary":', isPrimary, '}'
								)
							),
							']'
						) media
					FROM media
						JOIN mediaMap ON mediaMap.mediaId = media.id
					WHERE
						mediaMap.rewardCategoryId IS NOT NULL
					GROUP BY mediaMap.rewardCategoryId
				) rewardCategoryMedia ON rewardCategoryMedia.rewardCategoryId = rewardCategory.id
			 WHERE
			 ${pageQuery.filterQuery}
			 ${pageQuery.sortQuery} 
			 LIMIT ?
			 OFFSET ?;
			 SELECT Count(id) as total 
			 FROM ${this.tableName} 
			 WHERE ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	delete: null;
	deleteMany: null;
}

export const rewardCategory = (dbArgs) => {
	dbArgs.tableName = 'rewardCategory';
	return new RewardCategoryTable(dbArgs);
};
