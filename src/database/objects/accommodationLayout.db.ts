import Table from '../Table';
import mysql from 'mysql';
import { ObjectUtils } from '../../utils/utils';

export interface CreateLayout extends Api.AccommodationLayout.Req.Create {
	companyId: number;
}

export default class AccommodationLayout extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getById(layoutId: number, companyId?: number): Promise<Api.AccommodationLayout.Details> {
		return this.db.queryOne(
			`${AccommodationLayout.layoutDetailBaseQuery}
			WHERE accommodationLayout.id=? AND ${Table.buildCompanyIdQuery(
				companyId,
				this.tableName
			)} GROUP BY accommodationLayout.id;`,
			[layoutId]
		);
	}

	async getManyByIds(layoutIds: number[], companyId?: number): Promise<Api.AccommodationLayout.Details[]> {
		return this.db.runQuery(
			`${AccommodationLayout.layoutDetailBaseQuery}
			WHERE accommodationLayout.id IN (?) AND ${Table.buildCompanyIdQuery(
				companyId,
				this.tableName
			)} GROUP BY accommodationLayout.id;`,
			[layoutIds]
		);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<Api.AccommodationLayout.Res.GetByPage> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);

		let allObjects = await this.db.runQuery(
			`${AccommodationLayout.layoutDetailBaseQuery}
			WHERE
				${companyIdQueryString} AND
				${pageQuery.filterQuery}
				${pageQuery.sortQuery}
			LIMIT ?
			OFFSET ?;
			SELECT Count(id) as total FROM accommodationLayout WHERE ${companyIdQueryString} AND ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	async getForCompanyId(companyId: number): Promise<Api.AccommodationLayout.Details[]> {
		return this.db.runQuery(
			`${AccommodationLayout.layoutDetailBaseQuery}
			WHERE ${Table.buildCompanyIdQuery(companyId, this.tableName)} GROUP BY accommodationLayout.id;`,
			[companyId]
		);
	}

	static readonly layoutRoomsSubquery: string = `
		SELECT
			accommodationLayoutId,
			IFNULL(
				CONCAT('[',
					GROUP_CONCAT(
						CONCAT(
							'{"id":', id,
							',"companyId":', companyId,
							',"accommodationLayoutId":', accommodationLayoutId,
							',"title":"', title,
							'","description":"', description,
							'"}'
						)
					),
				']'),
			'[]') AS rooms
		FROM accommodationLayoutRoom
		GROUP BY accommodationLayoutId`;

	static readonly layoutDetailBaseQuery: string = `
		SELECT 
			accommodationLayout.*,
			${Table.concatenateMediaObject} AS media,
			IFNULL(accommodationRooms.rooms, '[]') AS rooms
		FROM accommodationLayout
			LEFT JOIN (
				${AccommodationLayout.layoutRoomsSubquery}
			) AS accommodationRooms 
				ON accommodationRooms.accommodationLayoutId=accommodationLayout.id
			LEFT JOIN media 
				ON media.id=accommodationLayout.mediaId`;
}

export const accommodationLayout = (dbArgs) => {
	dbArgs.tableName = 'accommodationLayout';
	return new AccommodationLayout(dbArgs);
};
