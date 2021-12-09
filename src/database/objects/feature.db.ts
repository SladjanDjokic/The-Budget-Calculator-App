import Table from '../Table';
import mysql from 'mysql';
import { ObjectUtils } from '../../utils/utils';

export interface FeatureCreate extends Api.Feature.Req.Create {
	companyId: number;
}

export default class FeatureDb extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getById(featureId: number): Promise<Api.Feature.Details> {
		return await this.db.queryOne(
			`SELECT feature.*, IFNULL(featureMedia.media, '${Table.mediaNotFoundObject}') media
			FROM feature
				LEFT JOIN(
			    SELECT mediaMap.featureId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"uploaderId":', uploaderId, ',"type":"', type, '","urls":', urls, ',"title":"', IFNULL(title,''), '","description":"', IFNULL(description,''), '","isPrimary":', isPrimary,  '}')), ']') media
			    FROM media
			             JOIN mediaMap ON mediaMap.mediaId=media.id
			    WHERE mediaMap.featureId=?
			    GROUP BY mediaMap.mediaId
			) featureMedia ON featureMedia.featureId=feature.id
			WHERE feature.id=? GROUP BY feature.id;`,
			[featureId, featureId]
		);
	}

	async getManyByIds(featureIds: number[]): Promise<Api.Feature.Details[]> {
		return await this.db.runQuery(
			`SELECT feature.*, IFNULL(featureMedia.media, '${Table.mediaNotFoundObject}') media
			FROM feature
				LEFT JOIN(
			    SELECT mediaMap.featureId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"uploaderId":', uploaderId, ',"type":"', type, '","urls":', urls, ',"title":"', IFNULL(title,''), '","description":"', IFNULL(description,''), '","isPrimary":', isPrimary,  '}')), ']') media
			    FROM media
			             LEFT JOIN mediaMap ON mediaMap.mediaId=media.id
			    GROUP BY mediaMap.mediaId
			) featureMedia ON featureMedia.featureId=feature.id
			WHERE feature.id in (?) GROUP BY feature.id;`,
			[featureIds]
		);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Feature.Details[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQueryString = companyId ? mysql.format(' companyId=? AND', [companyId]) : '';
		let allObjects = await this.db.runQuery(
			`Select feature.*, IFNULL(featureMedia.media, '${Table.mediaNotFoundObject}') media 
			FROM feature
			LEFT JOIN(
			    SELECT mediaMap.featureId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"uploaderId":', uploaderId, ',"type":"', type, '","urls":', urls, ',"title":"', IFNULL(title,''), '","description":"', IFNULL(description,''), '","isPrimary":', isPrimary,  '}')), ']') media
			    FROM media
			             LEFT JOIN mediaMap ON mediaMap.mediaId=media.id
			    GROUP BY mediaMap.mediaId
			) featureMedia ON featureMedia.featureId=feature.id
			WHERE
			${companyIdQueryString}
			${pageQuery.filterQuery}
			${pageQuery.sortQuery} 
			LIMIT ?
			OFFSET ?;
			SELECT Count(id) as total FROM feature WHERE ${companyIdQueryString} ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}
}

export const feature = (dbArgs) => {
	dbArgs.tableName = 'feature';
	return new FeatureDb(dbArgs);
};
