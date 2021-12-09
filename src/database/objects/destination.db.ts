import mysql from 'mysql';
import Table from '../Table';
import { ObjectUtils } from '../../utils/utils';
import IDestinationTable from '../interfaces/IDestinationTable';

export default class Destination extends Table implements IDestinationTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getForCompany(companyId: number): Promise<Model.Destination[]> {
		return await this.db.runQuery('SELECT * FROM destination WHERE companyId=?;', [companyId]);
	}

	async getById(destinationId: number, companyId?: number): Promise<Model.Destination> {
		return super.getById(destinationId, companyId);
	}

	async getManyByIds(destinationIds: number[], companyId?: number): Promise<Model.Destination[]> {
		return super.getManyByIds(destinationIds, companyId);
	}

	async getDestinationDetails(destinationId: number, companyId?: number): Promise<Api.Destination.Res.Details> {
		const destinationDetails = await this.db.queryOne(
			`${Destination.detailQuery}
			WHERE destination.id=? AND ${Table.buildCompanyIdQuery(companyId, this.tableName)} GROUP BY destination.id;`,
			[destinationId, companyId]
		);

		destinationDetails.accommodations.forEach((detailsAccommodation) => {
			if (!detailsAccommodation.maxSquareFt) delete detailsAccommodation.maxSquareFt;
			if (!detailsAccommodation.minSquareFt) delete detailsAccommodation.minSquareFt;
		});
		// Checking specifically for null because 0 is a valid value
		if (destinationDetails.latitude === null) delete destinationDetails.latitude;
		if (destinationDetails.longitude === null) delete destinationDetails.longitude;

		return destinationDetails;
	}

	async getDestinationRegions(destinationId: number): Promise<Api.Destination.Res.DestinationRegion[]> {
		return await this.db.runQuery(
			`SELECT
					regionId as id,
					region.name as name
						FROM destinationRegion
						LEFT JOIN region
						 	ON region.id = regionId
						 	 WHERE destinationId = ?;`,
			[destinationId]
		);
	}

	async updateDestinationRegions(destinationId: number, regions: number[]) {
		let queryList: string[] = [
			mysql.format('DELETE FROM destinationRegion WHERE destinationId = ?;', [destinationId])
		];
		for (let regionId of regions) {
			queryList.push(mysql.format('INSERT INTO destinationRegion SET ?;', [{ destinationId, regionId }]));
		}
		await this.db.runQuery(queryList.join(''));
	}

	async getPropertyTypes(destinationId: number): Promise<Api.Destination.Res.PropertyType[]> {
		return await this.db.runQuery(
			`SELECT
				propertyTypeId as id,
				type.name as name
					FROM destinationPropertyType
						LEFT JOIN propertyType as type
							ON propertyTypeId = type.id
					WHERE destinationId = ?;`,
			[destinationId]
		);
	}

	async getAllPropertyTypes(): Promise<Api.Destination.Res.PropertyType[]> {
		return await this.db.runQuery(
			`SELECT 
       				id, name 
						FROM propertyType ;`
		);
	}

	async updatePropertyTypes(destinationId: number, propertyTypes: number[]) {
		let queryList: string[] = [
			mysql.format('DELETE FROM destinationPropertyType WHERE destinationId = ?;', [destinationId])
		];
		for (let propertyTypeId of propertyTypes) {
			queryList.push(
				mysql.format('INSERT INTO destinationPropertyType SET ?;', [{ destinationId, propertyTypeId }])
			);
		}
		await this.db.runQuery(queryList.join(''));
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter?: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.Destination.Res.Details[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		let allObjects = await this.db.runQuery(
			`${Destination.detailQuery}
 			WHERE
			${companyIdQueryString} AND	${pageQuery.filterQuery}
			${pageQuery.sortQuery} 
			LIMIT ?
			OFFSET ?;
			SELECT Count(id) as total FROM destination WHERE ${companyIdQueryString} AND ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		const detailsArray: Api.Destination.Res.Details[] = allObjects[0];
		detailsArray.forEach((details) => {
			details.accommodations.forEach((detailsAccommodation) => {
				if (!detailsAccommodation.maxSquareFt) delete detailsAccommodation.maxSquareFt;
				if (!detailsAccommodation.minSquareFt) delete detailsAccommodation.minSquareFt;
			});
		});

		return { data: detailsArray, total };
	}

	async getAvailable(
		destinationIds: number[],
		propertyTypeIds?: number[],
		regionIds?: number[],
		bedroomCount?: number,
		bathroomCount?: number,
		companyId?: number
	): Promise<Api.Destination.Res.Availability[]> {
		const regionTypeQuery = ObjectUtils.isArrayWithData(regionIds)
			? mysql.format(
					'JOIN (select destinationId FROM destinationRegion WHERE regionId in (?)) region ON region.destinationId = destination.id',
					[regionIds]
			  )
			: '';

		return this.db.runQuery(
			`SELECT
				destination.id,
				destination.name,
				destination.description,
				destination.code,
				destination.status,
				destination.address1,
				destination.address2,
				destination.city,
				destination.state,
				destination.zip,
				destination.country,
			    IFNULL(destinationAccommodations.minBedroom, 0) as minBedroom,
			    IFNULL(destinationAccommodations.maxBedroom, 15) as maxBedroom,
       			IFNULL(destinationAccommodations.minBathroom, 0) as minBathroom,
       			IFNULL(destinationAccommodations.maxBathroom, 15) as maxBathroom,
       			IFNULL(propertyTypes.pt,'[]') propertyTypes,
				destination.logoUrl,
       			destination.reviewRating,
       			destination.reviewCount,
				IFNULL(destinationMedia.media, '${Table.mediaNotFoundObject}') media,
				IFNULL(experiences.experiences, '[]') experiences,
				IFNULL(destinationAccommodationTypes.accommodationTypes, '[]') accommodationTypes,
				IFNULL(destinationAccommodations.accommodations, '[]') accommodations
			FROM destination
			    ${regionTypeQuery}
				# destination media
				LEFT JOIN (
					SELECT
						mediaMap.destinationId AS destinationId,
						${Table.concatenateMediaArray}
					FROM media
						JOIN mediaMap ON mediaMap.mediaId = media.id
					GROUP BY destinationId
				) AS destinationMedia ON destinationMedia.destinationId = destination.id
				# destination.features
				LEFT JOIN (
					${Destination.destinationExperienceSubquery}
				) AS experiences
				ON experiences.destinationId = destination.id
				# destination accommodations
				JOIN (
					${Destination.buildAvailableAccommodationSubquery(propertyTypeIds, bedroomCount, bathroomCount)}
				) AS destinationAccommodations ON destinationAccommodations.destinationId = destination.id

				# destination.propertyTypes
				LEFT JOIN (
				 	SELECT destinationId,
				 		CONCAT('[',
				 			GROUP_CONCAT(
				 				CONCAT(
				 					'{"id":',p.id,',"name":"',p.name,'"}'
				 				)
				 			)
				 		,']') pt 
					FROM destinationPropertyType
				 		LEFT JOIN propertyType p ON destinationPropertyType.propertyTypeId = p.id
				 	GROUP BY destinationId
				) propertyTypes on propertyTypes.destinationId = destination.id

				# destination accommodationTypes
				LEFT JOIN (
					SELECT accommodationType.destinationId AS destinationId,
						CONCAT('[',
							GROUP_CONCAT(
								CONCAT(
									'{"id":', id,
									',"name":"', IFNULL(name, ''),
								'"}')
							),
						']') AS accommodationTypes
					FROM accommodationType
					GROUP BY destinationId
				) AS destinationAccommodationTypes ON destinationAccommodationTypes.destinationId = destination.id
			WHERE destination.isActive = 1 AND destination.id IN (?)
				AND ${Table.buildCompanyIdQuery(companyId, this.tableName)}
			GROUP BY destination.id;`,
			[destinationIds]
		);
	}

	async update(
		destinationId: number,
		updateData: Api.Destination.Req.Update,
		companyId: number
	): Promise<Api.Destination.Res.Details> {
		updateData = Table.columnObjectStringify(updateData);
		await this.db.runQuery(`UPDATE destination SET ? WHERE id=? AND ${Table.buildCompanyIdQuery(companyId)};`, [
			updateData,
			destinationId
		]);
		return await this.getDestinationDetails(destinationId, companyId);
	}

	delete: null;
	deleteMany: null;

	public static readonly destinationExperienceSubquery: string = `
		SELECT
			destinationExperience.destinationId AS destinationId,
			IFNULL(
				CONCAT('[',
					GROUP_CONCAT(
						CONCAT(
							'{"id":',destinationExperience.id,
							',"experienceId":',destinationExperience.experienceId,
							',"destinationId":',destinationExperience.destinationId,
							',"title":"', IFNULL(experience.title, ''),
							'","description":"', IFNULL(destinationExperience.description, ''),
							'","isHighlighted":', destinationExperience.isHighlighted,
							',"icon":"', IFNULL(experience.icon, ''),
							'","media":', IFNULL(experienceMedia.media,'${Table.mediaNotFoundObject}'),
						'}')
					),
				']'),
			'[]') AS experiences
		FROM experience
			JOIN destinationExperience
				on destinationExperience.experienceId = experience.id
			LEFT JOIN (
			SELECT
				mediaMap.destinationExperienceId,
				${Table.concatenateMediaArray}
			FROM media
					 JOIN mediaMap ON mediaMap.mediaId=media.id
			GROUP BY mediaMap.destinationExperienceId
		) AS experienceMedia
					  ON experienceMedia.destinationExperienceId=destinationExperience.id
		GROUP BY destinationId`;

	private static readonly detailQuery: string = `
		SELECT destination.id,
			destination.externalSystemId AS externalId,
			destination.name,
			destination.description,
       		destination.locationDescription,
			destination.code,
			destination.status,
			destination.address1,
			destination.address2,
			destination.city,
			destination.state,
			destination.zip,
			destination.country,
			destination.latitude,
			destination.longitude,
		    destination.isActive,
			destination.logoUrl,
			destination.heroUrl,
       		destination.reviewRating,
       		destination.reviewCount,
		   	IFNULL(destinationAccommodations.minBedroom, 0) as minBedroom,
		   	IFNULL(destinationAccommodations.maxBedroom, 15) as maxBedroom,
		   	IFNULL(destinationAccommodations.minBathroom, 0) as minBathroom,
		   	IFNULL(destinationAccommodations.maxBathroom, 15) as maxBathroom,
       		IFNULL(propertyTypes.pt, '[]') propertyTypes,
       		IFNULL(destinationRegions.regions, '[]') regions,
			IFNULL(destinationMedia.media,'${Table.mediaNotFoundObject}') media,
			IFNULL(experiences.experiences, '[]') experiences,
			IFNULL(packages.packages, '[]') packages,
			IFNULL(destinationAccommodations.accommodations, '[]') accommodations,
			IFNULL(destinationAccommodationTypes.accommodationTypes, '[]') accommodationTypes,
			IFNULL(destinationPolicies.policies, '[]') AS policies
		FROM destination
			# destination.media
			LEFT JOIN (
				SELECT
					mediaMap.destinationId, 
					${Table.concatenateMediaArray}
				FROM media
					JOIN mediaMap ON mediaMap.mediaId=media.id
				GROUP BY destinationId
			) AS destinationMedia
			ON destinationMedia.destinationId=destination.id
			
			# destination.experiences
			LEFT JOIN (${Destination.destinationExperienceSubquery}) AS experiences
				ON experiences.destinationId=destination.id
			
			# destination.packages
			LEFT JOIN (
				SELECT upsellPackage.destinationId AS destinationId,
					CONCAT('[',
						GROUP_CONCAT(
							CONCAT(
								'{"id":',id,
								',"companyId":', companyId,
								',"destinationId":',destinationId,
								',"title":"',IFNULL(title,''),
			    				'","externalTitle":"',IFNULL(externalTitle, ''),
			    				'","code":"',IFNULL(code, ''),
								'","description":"',REPLACE(IFNULL(description,''),'\\"','\\\\"'),
								'","media":', IFNULL(packageMedia.media,'${Table.mediaNotFoundObject}'),'}'
							)
						),
					']') AS packages
				FROM upsellPackage
					LEFT JOIN (
						SELECT
							mediaMap.packageId,
							${Table.concatenateMediaArray}
						FROM media
							JOIN mediaMap ON mediaMap.mediaId=media.id
						GROUP BY mediaMap.packageId) packageMedia 
							ON packageMedia.packageId=upsellPackage.id
				GROUP BY destinationId
			) AS packages 
			ON packages.destinationId=destination.id
			
			# destination.accommodations
			LEFT JOIN (
				SELECT destinationId,
			    	MIN(bedroomCount) as minBedroom,
			    	MAX(bedroomCount) as maxBedroom,
			    	MIN(bathroomCount) as minBathroom,
			    	MAX(bathroomCount) as maxBathroom,
					CONCAT('[',
						GROUP_CONCAT(
							CONCAT(
								'{"id":', id,
								',"name":"', IFNULL(name, ''),
								'","shortDescription":"', IFNULL(shortDescription,''),
								'","longDescription":"', IFNULL(longDescription,''),
								'","maxOccupantCount":', IFNULL(maxOccupantCount, 0),
								',"status":"', status,
								'","maxSquareFt":', IFNULL(JSON_EXTRACT(accommodation.size, '$.max'), 0),
								',"minSquareFt":', IFNULL(JSON_EXTRACT(accommodation.size, '$.min'), 0),
								'}'
							)
						),
					']') AS accommodations
				FROM accommodation
					WHERE \`status\`='${'ACTIVE' as Model.AccommodationStatusType}'
				GROUP BY destinationId
			) AS destinationAccommodations 
			ON destinationAccommodations.destinationId=destination.id
			
			# destination.accommodationTypes
			LEFT JOIN (
				SELECT destinationId,
					CONCAT('[',
						GROUP_CONCAT(
							CONCAT(
								'{"id":', id,
								',"name":"', IFNULL(name, ''),
								'","description":"', IFNULL(description, ''),
								'","code":"', code, '"}'
							)
						),
					']') AS accommodationTypes
				FROM accommodationType
				GROUP BY destinationId
			) AS destinationAccommodationTypes 
			ON destinationAccommodationTypes.destinationId=destination.id
			    
			# destination.propertyTypes
			 LEFT JOIN (
			    SELECT destinationId, 
					CONCAT('[',
						GROUP_CONCAT(
							CONCAT(
							 '{"id":',p.id,',"name":"',p.name,'"}'
							)
						)
					,']') pt FROM destinationPropertyType
			 	LEFT JOIN propertyType p ON destinationPropertyType.propertyTypeId = p.id
			 	GROUP BY destinationId
			 ) propertyTypes on propertyTypes.destinationId = destination.id

			 # destination.destinationRegions
			 LEFT JOIN (
			 	SELECT destinationId,
			 	CONCAT('[',
			 		GROUP_CONCAT(
			 			CONCAT(
							 '{"id":',r.id,',"name":"',r.name,'"}'
						 )
			 		)
			 	,']') regions FROM destinationRegion
			 	LEFT JOIN region r ON destinationRegion.regionId = r.id
			 GROUP BY destinationId
			 ) destinationRegions on destinationRegions.destinationId = destination.id

			 # destination.regions
			 LEFT JOIN (
			 SELECT destinationId,
			 	CONCAT('[',
			 		GROUP_CONCAT(
			 			CONCAT(
			 				'{"id":',region.id,',"name":"',region.name,'"}'
						 )
					)
			 	,']') regions FROM destinationRegion
			 LEFT JOIN region ON destinationRegion.regionId = region.id
			 GROUP BY destinationId
			 ) regions on regions.destinationId = destination.id
		
			#destination.policies
			LEFT JOIN (
				SELECT destinationId,
					CONCAT('[',
						GROUP_CONCAT(
							CONCAT(
								'{"type":"',policyType,
								'","value":"',value,'"}'
							)
						)
					,']') AS policies
				FROM destinationPolicy
				GROUP BY destinationId
			) AS destinationPolicies
			ON destinationPolicies.destinationId=destination.id`;

	private static buildAvailableAccommodationSubquery(
		propertyTypeIds: number[],
		bedroomCount?: number,
		bathroomCount?: number
	): string {
		const propertyTypeIdQuery = ObjectUtils.isArrayWithData(propertyTypeIds)
			? mysql.format('WHERE accommodation.propertyTypeId IN (?)', [propertyTypeIds])
			: 'WHERE TRUE';

		const bedroomQuery = bedroomCount ? mysql.format('AND bedroomCount >= ?', [bedroomCount]) : 'AND TRUE';
		const bathroomQuery = bathroomCount ? mysql.format('AND bathroomCount >= ?', [bathroomCount]) : 'AND TRUE';
		return `
			SELECT
				accommodation.destinationId AS destinationId,
			   	MIN(accommodation.bedroomCount) as minBedroom,
			   	MAX(accommodation.bedroomCount) as maxBedroom,
			    MIN(accommodation.bathroomCount) as minBathroom,
			    MAX(accommodation.bathroomCount) as maxBathroom,
				CONCAT('[',
					GROUP_CONCAT(
						CONCAT(
							'{"id":', id,
							',"name":"', IFNULL(name, ''),
							'","propertyTypeId":', IFNULL(accommodation.propertyTypeId,-1),
							',"amenities":', IFNULL(accommodationAmenities.amenities, '[]'),
							',"bedroomCount":', IFNULL(roomCount,0),
							',"bedDetails":', IFNULL(bedDetails,'{}'),
						    ',"shortDescription":"', IFNULL(shortDescription, ''),
						    '","longDescription":"', IFNULL(longDescription, ''),
							'","priceCents":', IFNULL(priceCents,0),
							',"maxOccupantCount":', IFNULL(maxOccupantCount,0),
                            ',"maxSquareFt":', IFNULL(JSON_EXTRACT(accommodation.size, '$.max'), 0),
                            ',"minSquareFt":', IFNULL(JSON_EXTRACT(accommodation.size, '$.min'), 0),
						'}')
					),
				']') accommodations
			FROM accommodation
				LEFT JOIN
					(SELECT accommodationAmenity.accommodationId AS accommodationId,
					        amenityId,
						CONCAT('[',
							GROUP_CONCAT(
								CONCAT(
									'{"id":', amenity.id,
									',"title":"', IFNULL(amenity.title, ''),
									'","icon":"', IFNULL(amenity.icon, ''),
								'"}')
							),
						']') AS amenities
					FROM accommodationAmenity
						JOIN amenity ON amenity.id = accommodationAmenity.amenityId
					GROUP BY accommodationAmenity.accommodationId
				) AS accommodationAmenities ON accommodationAmenities.accommodationId = accommodation.id
			${propertyTypeIdQuery} ${bedroomQuery} ${bathroomQuery}
			GROUP BY destinationId
	`;
	}
}

export const destination = (dbArgs) => {
	dbArgs.tableName = 'destination';
	return new Destination(dbArgs);
};
