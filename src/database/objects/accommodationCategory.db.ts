import Table from '../Table';

export interface CreateAccommodationCategory extends Api.AccommodationCategory.Req.Create {
	companyId: number;
}

export interface UpdateAccommodationCategory extends Api.AccommodationCategory.Req.Update {
	companyId: number;
}

export default class AccommodationCategory extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getById(accommodationCategoryId: number, companyId?: number): Promise<Api.AccommodationCategory.Details> {
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		return await this.db.queryOne(
			`SELECT accommodationCategory.*, IFNULL(accommodationCategoryMedia.media, '${Table.mediaNotFoundObject}') media, IFNULL(accommodationCategoryFeatures.features, '[]') features
				FROM accommodationCategory
						 # accommodationCategory.media
						 LEFT JOIN (
					SELECT mediaMap.accommodationCategoryId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"uploaderId":', uploaderId, ',"type":"', type, '","urls":', urls, ',"title":"', IFNULL(title,''), '","description":"', IFNULL(description,''), '","isPrimary":', isPrimary,  '}')), ']') media
					FROM media
							 LEFT JOIN mediaMap ON mediaMap.mediaId=media.id
					GROUP BY accommodationCategoryId
				) accommodationCategoryMedia ON accommodationCategoryMedia.accommodationCategoryId=accommodationCategory.id
					# accommodationCategory.features
				LEFT JOIN (
					SELECT feature.accommodationCategoryId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"companyId":', companyId,',"title":"',IFNULL(title,''),'","description":"',IFNULL(description,''),'","icon":"',IFNULL(icon,''),'","isActive":',isActive,',"isCarousel":',isCarousel,',"media":', IFNULL(featureMedia.media, '${Table.mediaNotFoundObject}'), '}')),']') features
					FROM feature
					LEFT JOIN (
						SELECT mediaMap.featureId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"uploaderId":', uploaderId, ',"type":"', type, '","urls":', urls, ',"title":"', IFNULL(title,''), '","description":"', IFNULL(description,''), '","isPrimary":', isPrimary,  '}')), ']') media
						FROM mediaMap
						LEFT JOIN media m on mediaMap.mediaId = m.id
						GROUP BY mediaMap.featureId
						) AS featureMedia ON featureMedia.featureId=feature.id
					GROUP BY feature.accommodationCategoryId
				) accommodationCategoryFeatures ON accommodationCategoryFeatures.accommodationCategoryId = accommodationCategory.id
					WHERE ${companyIdQueryString} AND accommodationCategory.id=?
					GROUP BY accommodationCategory.id;`,
			[accommodationCategoryId]
		);
	}

	async getManyByIds(
		accommodationCategoryIds: number[],
		companyId?: number
	): Promise<Api.AccommodationCategory.Details[]> {
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		return await this.db.runQuery(
			`SELECT accommodationCategory.*, IFNULL(accommodationCategoryMedia.media, '${Table.mediaNotFoundObject}') media, IFNULL(accommodationCategoryFeatures.features, '[]') features
				FROM accommodationCategory
						 # accommodationCategory.media
						 LEFT JOIN (
					SELECT mediaMap.accommodationCategoryId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"uploaderId":', uploaderId, ',"type":"', type, '","urls":', urls, ',"title":"', IFNULL(title,''), '","description":"', IFNULL(description,''), '","isPrimary":', isPrimary,  '}')), ']') media
					FROM media
							 LEFT JOIN mediaMap ON mediaMap.mediaId=media.id
					GROUP BY accommodationCategoryId
				) accommodationCategoryMedia ON accommodationCategoryMedia.accommodationCategoryId=accommodationCategory.id
					# accommodationCategory.features
				LEFT JOIN (
					SELECT feature.accommodationCategoryId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"companyId":', companyId,',"title":"',IFNULL(title,''),'","description":"',IFNULL(description,''),'","icon":"',IFNULL(icon,''),'","isActive":',isActive,',"isCarousel":',isCarousel,',"media":', IFNULL(featureMedia.media, '${Table.mediaNotFoundObject}'), '}')),']') features
					FROM feature
					LEFT JOIN (
						SELECT mediaMap.featureId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"uploaderId":', uploaderId, ',"type":"', type, '","urls":', urls, ',"title":"', IFNULL(title,''), '","description":"', IFNULL(description,''), '","isPrimary":', isPrimary,  '}')), ']') media
						FROM mediaMap
						LEFT JOIN media m on mediaMap.mediaId = m.id
						GROUP BY mediaMap.featureId
						) AS featureMedia ON featureMedia.featureId=feature.id
					GROUP BY feature.accommodationCategoryId
				) accommodationCategoryFeatures ON accommodationCategoryFeatures.accommodationCategoryId = accommodationCategory.id
					WHERE ${companyIdQueryString} AND accommodationCategory.id in (?)
					GROUP BY accommodationCategory.id;`,
			[accommodationCategoryIds]
		);
	}

	async getForAccommodation(accommodationId: number): Promise<Api.AccommodationCategory.Details[]> {
		return await this.db.runQuery(
			`SELECT accommodationCategory.*, IFNULL(accommodationCategoryMedia.media, '${Table.mediaNotFoundObject}') media, IFNULL(accommodationCategoryFeatures.features, '[]') features
				FROM accommodationCategory
				# accommodationCategory.media
				LEFT JOIN (
					SELECT mediaMap.accommodationCategoryId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"uploaderId":', uploaderId, ',"type":"', type, '","urls":', urls, ',"title":"', IFNULL(title,''), '","description":"', IFNULL(description,''), '","isPrimary":', isPrimary,  '}')), ']') media
					FROM media
							 LEFT JOIN mediaMap ON mediaMap.mediaId=media.id
					GROUP BY accommodationCategoryId
				) accommodationCategoryMedia ON accommodationCategoryMedia.accommodationCategoryId=accommodationCategory.id
					# accommodationCategory.features
				LEFT JOIN (
					SELECT feature.accommodationCategoryId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"companyId":', companyId,',"title":"',IFNULL(title,''),'","description":"',IFNULL(description,''),'","icon":"',IFNULL(icon,''),'","isActive":',isActive,',"isCarousel":',isCarousel,',"media":', IFNULL(featureMedia.media, '${Table.mediaNotFoundObject}'), '}')),']') features
					FROM feature
					LEFT JOIN (
						SELECT mediaMap.featureId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"uploaderId":', uploaderId, ',"type":"', type, '","urls":', urls, ',"title":"', IFNULL(title,''), '","description":"', IFNULL(description,''), '","isPrimary":', isPrimary,  '}')), ']') media
						FROM mediaMap
						LEFT JOIN media m on mediaMap.mediaId = m.id
						GROUP BY mediaMap.featureId
						) AS featureMedia ON featureMedia.featureId=feature.id
					GROUP BY feature.accommodationCategoryId
				) accommodationCategoryFeatures ON accommodationCategoryFeatures.accommodationCategoryId = accommodationCategory.id
					WHERE accommodationCategory.accommodationId=?
					GROUP BY accommodationCategory.id;`,
			[accommodationId]
		);
	}

	async getForDestination(destinationId: number): Promise<Api.AccommodationCategory.Details[]> {
		return await this.db.runQuery(
			`SELECT accommodationCategory.*, IFNULL(accommodationCategoryMedia.media, '${Table.mediaNotFoundObject}') media, IFNULL(accommodationCategoryFeatures.features, '[]') features
				FROM accommodationCategory
				JOIN accommodation ON accommodation.id=accommodationCategory.accommodationId
				JOIN destination ON destination.id=accommodation.destinationId
				# accommodationCategory.media
				LEFT JOIN (
					SELECT mediaMap.accommodationCategoryId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"uploaderId":', uploaderId, ',"type":"', type, '","urls":', urls, ',"title":"', IFNULL(title,''), '","description":"', IFNULL(description,''), '","isPrimary":', isPrimary,  '}')), ']') media
					FROM media
							 LEFT JOIN mediaMap ON mediaMap.mediaId=media.id
					GROUP BY accommodationCategoryId
				) accommodationCategoryMedia ON accommodationCategoryMedia.accommodationCategoryId=accommodationCategory.id
					# accommodationCategory.features
				LEFT JOIN (
					SELECT feature.accommodationCategoryId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"companyId":', companyId,',"title":"',IFNULL(title,''),'","description":"',IFNULL(description,''),'","icon":"',IFNULL(icon,''),'","isActive":',isActive,',"isCarousel":',isCarousel,',"media":', IFNULL(featureMedia.media, '${Table.mediaNotFoundObject}'), '}')),']') features
					FROM feature
					LEFT JOIN (
						SELECT mediaMap.featureId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"uploaderId":', uploaderId, ',"type":"', type, '","urls":', urls, ',"title":"', IFNULL(title,''), '","description":"', IFNULL(description,''), '","isPrimary":', isPrimary,  '}')), ']') media
						FROM mediaMap
						LEFT JOIN media m on mediaMap.mediaId = m.id
						GROUP BY mediaMap.featureId
						) AS featureMedia ON featureMedia.featureId=feature.id
					GROUP BY feature.accommodationCategoryId
				) accommodationCategoryFeatures ON accommodationCategoryFeatures.accommodationCategoryId = accommodationCategory.id
					WHERE destination.id=?
					GROUP BY accommodationCategory.id;`,
			[destinationId]
		);
	}
}

export const accommodationCategory = (dbArgs) => {
	dbArgs.tableName = 'accommodationCategory';
	return new AccommodationCategory(dbArgs);
};
