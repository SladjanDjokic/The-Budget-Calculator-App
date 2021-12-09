import Table from '../Table';
import mysql from 'mysql';
import { ObjectUtils } from '../../utils/utils';
import IAccommodationTable from '../interfaces/IAccommodationTable';
import AccommodationLayout from './accommodationLayout.db';

export default class Accommodation extends Table implements IAccommodationTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	allForCompany(companyId: number): Promise<Model.Accommodation[]> {
		return this.db.runQuery('SELECT * FROM accommodation WHERE companyId=?;', [companyId]);
	}

	forExternalId(externalId: string, destinationId: number, companyId?: number): Promise<Model.Accommodation> {
		return this.db.queryOne(
			`SELECT * FROM accommodation WHERE externalSystemId=? AND destinationId=? AND ${Table.buildCompanyIdQuery(
				companyId
			)};`,
			[externalId, destinationId]
		);
	}

	async getAllForDestination(destinationId: number, companyId?: number) {
		return await this.db.runQuery(
			`SELECT * FROM accommodation WHERE destinationId=? AND ${Table.buildCompanyIdQuery(companyId)};`,
			[destinationId]
		);
	}

	async getAllForManyDestinations(destinationIds: number[], companyId: number) {
		return await this.db.runQuery(
			`SELECT * FROM accommodation WHERE destinationId IN (?) AND ${Table.buildCompanyIdQuery(companyId)};`,
			[destinationIds]
		);
	}

	async update(
		accommodationId: number,
		updateData: Api.Accommodation.Req.Update,
		companyId: number
	): Promise<Api.Accommodation.Res.Details> {
		updateData = Table.columnObjectStringify(updateData);
		await this.db.runQuery(`UPDATE accommodation SET ? WHERE id=? AND ${Table.buildCompanyIdQuery(companyId)};`, [
			updateData,
			accommodationId
		]);
		return await this.getAccommodationDetails(accommodationId, companyId);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Accommodation.Res.Details[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		let allObjects = await this.db.runQuery(
			`SELECT
				${Accommodation.accommodationSelectClause}
			FROM accommodation
			    JOIN accommodationType ON accommodation.accommodationTypeId = accommodationType.id

			    # Accommodation.media
				LEFT JOIN (${Accommodation.accommodationMediaSubquery}) AS accommodationMedia
					ON accommodationMedia.accommodationId=accommodation.id
				
				# Accommodation.amenities
				LEFT JOIN (${Accommodation.accommodationAmenitySubquery}) AS amenities
					ON amenities.accommodationId=accommodation.id
				
				# Accommodation.layout
				LEFT JOIN (${Accommodation.layoutSubquery}) as accommodationLayout
					ON accommodationLayout.accommodationId=accommodation.id

			    # Accommodation.categories
			     LEFT JOIN (
                 	SELECT accommodationId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"companyId":', companyId,',"accommodationId":',accommodationId,',"title":"',IFNULL(title,''),'","description":"',IFNULL(description,''),'","media":', IFNULL(accommodationCategoryMedia.media,'${Table.mediaNotFoundObject}'), ',"features":', IFNULL(accommodationCategoryFeatures.features, '[]'), '}')), ']') AS categories
                 	FROM accommodationCategory
                 		LEFT JOIN (
                 			SELECT 
							 	mediaMap.accommodationCategoryId,
								${Table.concatenateMediaArray}
                 			FROM media
                 				JOIN mediaMap ON mediaMap.mediaId=media.id
                 GROUP BY mediaMap.accommodationCategoryId) accommodationCategoryMedia on accommodationCategoryMedia.accommodationCategoryId=accommodationCategory.id
				LEFT JOIN (
                 	SELECT 
					 	feature.accommodationCategoryId,
						CONCAT('[',
						 	GROUP_CONCAT(
								 CONCAT(
									'{"id":',id,
									',"companyId":', companyId,
									',"accommodationCategoryId":',accommodationCategoryId,
									',"title":"',IFNULL(title,''),
									'","description":"',IFNULL(description,''),
									'","icon":"',IFNULL(icon,''),
									'","isActive":',isActive,
									',"isCarousel":',isCarousel,
									',"media":', IFNULL(featureMedia.media,'${Table.mediaNotFoundObject}'),
									'}'
								)
							),
						']') AS features
                 	FROM feature
                 		LEFT JOIN (
                 			SELECT 
								mediaMap.featureId,
								${Table.concatenateMediaArray}
                 			FROM media
                 				JOIN mediaMap ON mediaMap.mediaId=media.id
                 			GROUP BY mediaMap.featureId
						) AS featureMedia ON featureMedia.featureId=feature.id
					GROUP BY accommodationCategoryId
				) accommodationCategoryFeatures 
					ON accommodationCategory.id = accommodationCategoryFeatures.accommodationCategoryId
					GROUP BY accommodationCategory.accommodationId
				) as accommodationCategories ON accommodationCategories.accommodationId=accommodation.id
			WHERE
			${companyIdQueryString} AND ${pageQuery.filterQuery}
			${pageQuery.sortQuery} 
			LIMIT ?
			OFFSET ?;
			SELECT Count(accommodation.id) as total
			FROM accommodation 
				JOIN accommodationType ON accommodation.accommodationTypeId = accommodationType.id 
			WHERE ${companyIdQueryString} AND ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	/**
	 * Update Internal - Only for internal cron process sync (Sabre)
	 * @param accommodationId
	 * @param updateData
	 */
	async updateInternal(accommodationId: number, updateData: Partial<Model.Accommodation>) {
		return await super.update(accommodationId, updateData);
	}

	/**
	 * Get Accommodation Details
	 * @param {number} accommodationId
	 * @returns {Api.Accommodation.Res.Details} Full Accommodation Details object for client side
	 * @note - Please be careful with this query if you modify it
	 */
	async getAccommodationDetails(accommodationId: number, companyId?: number): Promise<Api.Accommodation.Res.Details> {
		return await this.db.queryOne(
			`${Accommodation.accommodationDetailBaseQuery}
			WHERE accommodation.id=? AND ${Table.buildCompanyIdQuery(companyId, 'accommodation')};`,
			[accommodationId, accommodationId]
		);
	}

	async getAvailableByIds(
		accommodationIds: number[],
		propertyTypeIds?: number[],
		bedroomCount?: number,
		bathroomCount?: number
	): Promise<Api.Accommodation.Res.Availability[]> {
		const propertyTypeIdQuery = ObjectUtils.isArrayWithData(propertyTypeIds)
			? mysql.format('accommodation.propertyTypeId IN (?)', [propertyTypeIds])
			: 'TRUE';

		const bedroomQuery = bedroomCount ? mysql.format('AND bedroomCount >= ?', [bedroomCount]) : 'AND TRUE';
		const bathroomQuery = bathroomCount ? mysql.format('AND bathroomCount >= ?', [bathroomCount]) : 'AND TRUE';

		return this.db.runQuery(
			`SELECT
		    accommodation.id,
		    accommodation.name,
			accommodation.propertyTypeId,
		    accommodation.longDescription,
		    IFNULL(accommodationMedia.media, '${Table.mediaNotFoundObject}') media,
		    IFNULL(amenities.amenities, '[]') amenities,
		    accommodation.maxSleeps,
		    accommodation.maxOccupantCount,
       		accommodation.bedroomCount,
       		accommodation.bathroomCount,
		    accommodation.size,
		    accommodation.adaCompliant,
		    accommodation.extraBeds,
		    accommodation.extraBedPriceCents
		FROM accommodation
		         LEFT JOIN (
		             ${Accommodation.accommodationAmenitySubquery}) amenities ON amenities.accommodationId=accommodation.id
		         LEFT JOIN (SELECT
		                        accommodation.id,
		                        CONCAT('[',GROUP_CONCAT(aC.id),']') accommodationCategoryIds
		                    FROM accommodation
		                             JOIN accommodationCategory aC ON accommodation.id = aC.accommodationId
		                    GROUP BY accommodation.id) accommodationCategories ON accommodationCategories.id=accommodation.id
		         LEFT JOIN (
		    SELECT
		        accommodationMedia.accommodationId,
		        ${Table.concatenateMediaArray}
		    FROM media
		             JOIN (
		        SELECT
		            mediaMap.mediaId, IFNULL(accommodationCategories.accommodationId, a.id) accommodationId, mediaMap.accommodationCategoryId
		        FROM mediaMap
		                 LEFT JOIN accommodation a on mediaMap.accommodationId = a.id
		                 LEFT JOIN(SELECT
		                               accommodation.id accommodationId,
		                               aC.id accommodationCategoryId
		                           FROM accommodation
		                                    JOIN accommodationCategory aC ON accommodation.id = aC.accommodationId
		        ) accommodationCategories ON accommodationCategories.accommodationCategoryId=mediaMap.accommodationCategoryId
		    ) accommodationMedia ON accommodationMedia.mediaId=media.id
		    WHERE accommodationId
		    GROUP BY accommodationMedia.accommodationId
		) accommodationMedia ON accommodationMedia.accommodationId=accommodation.id
		WHERE accommodation.id IN (?)
		  AND ${propertyTypeIdQuery} ${bedroomQuery} ${bathroomQuery};`,
			[accommodationIds]
		);
	}

	private static readonly accommodationSelectClause = `
		accommodation.*,
		accommodationType.type accommodationType,
		accommodationType.code accommodationTypeCode,
		IFNULL(accommodationType.description, '') accommodationTypeDescription,
		IFNULL(accommodationMedia.media,'${Table.mediaNotFoundObject}') media,
		IFNULL(accommodationLayout.layouts, '[]') layout,
		IFNULL(accommodationCategories.categories, '[]') categories,
		IFNULL(amenities.amenities, '[]') amenities`;

	static readonly accommodationMediaSubquery: string = `
		SELECT
			accommodationId,
			${Table.concatenateMediaArray}
		FROM media
			JOIN mediaMap ON mediaMap.mediaId=media.id
		GROUP BY accommodationId`;

	private static readonly accommodationAmenitySubquery: string = `
		SELECT 
			accommodationAmenity.accommodationId AS accommodationId,
			CONCAT('[',
				GROUP_CONCAT(
					CONCAT(
						'{"id":',accommodationAmenity.amenityId,
						',"title":"',IFNULL(title,''),
						'","icon":"',IFNULL(icon,''),
						'"}'
					)
				), 
			']') AS amenities
		FROM accommodationAmenity
			JOIN amenity ON amenity.id = accommodationAmenity.amenityId
		GROUP BY accommodationAmenity.accommodationId`;

	private static readonly layoutSubquery: string = `
		SELECT 
			accommodationLayout.accommodationId, 
			CONCAT('[',
				GROUP_CONCAT(
					CONCAT(
						'{"id":',accommodationLayout.id,
						',"companyId":', accommodationLayout.companyId,
						',"accommodationId":',accommodationLayout.accommodationId,
						',"title":"',IFNULL(accommodationLayout.title,''),
						'","rooms":', IFNULL(accommodationLayoutRooms.rooms,'[]'),
						',"media":',${Table.concatenateMediaObject},
						'}'
					)
				),
			']') AS layouts
		FROM accommodationLayout
			LEFT JOIN (
				${AccommodationLayout.layoutRoomsSubquery}
			) AS accommodationLayoutRooms on accommodationLayoutRooms.accommodationLayoutId=accommodationLayout.id
			LEFT JOIN media 
				ON media.id=accommodationLayout.mediaId
		GROUP BY accommodationLayout.accommodationId`;

	private static readonly accommodationDetailBaseQuery: string = `
		SELECT
			${Accommodation.accommodationSelectClause}
		FROM accommodation
			JOIN accommodationType ON accommodation.accommodationTypeId = accommodationType.id
			
			# Accommodation.media
			LEFT JOIN (${Accommodation.accommodationMediaSubquery}) AS accommodationMedia
				ON accommodationMedia.accommodationId=accommodation.id
			
			# Accommodation.amenities
			LEFT JOIN (${Accommodation.accommodationAmenitySubquery}) AS amenities
				ON amenities.accommodationId=accommodation.id
			
			# Accommodation.layout
			LEFT JOIN (${Accommodation.layoutSubquery}) as accommodationLayout
				ON accommodationLayout.accommodationId=accommodation.id
			
			# Accommodation.categories
			LEFT JOIN (
				SELECT accommodationId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"companyId":', companyId,',"accommodationId":',accommodationId,',"title":"',IFNULL(title,''),'","description":"',IFNULL(description,''),'","media":', IFNULL(accommodationCategoryMedia.media,'${Table.mediaNotFoundObject}'), ',"features":', IFNULL(accommodationCategoryFeatures.features, '[]'), '}')), ']') AS categories
				FROM accommodationCategory
					LEFT JOIN (
						SELECT 
							mediaMap.accommodationCategoryId, 
							${Table.concatenateMediaArray}
						FROM media
							JOIN mediaMap ON mediaMap.mediaId=media.id
						GROUP BY mediaMap.accommodationCategoryId
					) accommodationCategoryMedia on accommodationCategoryMedia.accommodationCategoryId=accommodationCategory.id
					LEFT JOIN (
						SELECT feature.accommodationCategoryId, CONCAT('[',GROUP_CONCAT(CONCAT('{"id":',id,',"companyId":', companyId,',"accommodationCategoryId":',accommodationCategoryId,',"title":"',IFNULL(title,''),'","description":"',IFNULL(description,''),'","icon":"',IFNULL(icon,''),'","isActive":',isActive,',"isCarousel":',isCarousel,',"media":', IFNULL(featureMedia.media,'${Table.mediaNotFoundObject}'),'}')), ']') features
						FROM feature
							LEFT JOIN (
								SELECT
									mediaMap.featureId, 
									${Table.concatenateMediaArray}
								FROM media
									JOIN mediaMap ON mediaMap.mediaId=media.id
								GROUP BY mediaMap.featureId
							) featureMedia on featureMedia.featureId=feature.id
						GROUP BY accommodationCategoryId
					) accommodationCategoryFeatures on accommodationCategory.id = accommodationCategoryFeatures.accommodationCategoryId
				GROUP BY accommodationCategory.accommodationId
			) as accommodationCategories ON accommodationCategories.accommodationId=accommodation.id`;
}

export const accommodation = (dbArgs) => {
	dbArgs.tableName = 'accommodation';
	return new Accommodation(dbArgs);
};
