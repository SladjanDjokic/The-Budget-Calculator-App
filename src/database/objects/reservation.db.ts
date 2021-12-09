import Table from '../Table';
import mysql from 'mysql';
import { DateUtils, ObjectUtils } from '../../utils/utils';
import IReservationTable, {
	ReservationToSave,
	ReservationToUpdate,
	ReservationUpsellPackageToSave
} from '../interfaces/IReservationTable';
import { RsError } from '../../utils/errors';
import Accommodation from './accommodation.db';
import logger from '../../utils/logger';
import Destination from './destination.db';

export interface UpcomingReservation extends Api.Reservation.Req.Upcoming {
	userId: number;
}

export default class Reservation extends Table implements IReservationTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async create({ upsellPackages: packages, ...request }: ReservationToSave): Promise<Api.Reservation.Res.Get> {
		const reservation: Partial<Model.Reservation> = {
			...request,
			id: null,
			arrivalDate: DateUtils.clientToServerDateTime(new Date(request.arrivalDate)),
			departureDate: DateUtils.clientToServerDateTime(new Date(request.departureDate)),
			confirmationDate: !request.confirmationDate
				? null
				: DateUtils.clientToServerDateTime(new Date(request.confirmationDate)),
			canceledOn: null,
			priceDetail: JSON.stringify(request.priceDetail)
		};
		let result: Api.Reservation.Res.Get = await super.create(reservation);
		packages?.forEach(async (item) => await this.linkReservationPackage(result.id, item));
		return result;
	}

	async update(
		reservationId: number,
		{ upsellPackages, ...updatedReservation }: ReservationToUpdate
	): Promise<Api.Reservation.Res.Get> {
		await super.update(reservationId, updatedReservation);
		const linkPromises: Promise<void>[] = [];
		if (!!upsellPackages) {
			linkPromises.push(
				this.unlinkReservationPackages(reservationId).then(() =>
					upsellPackages.forEach(async (item) =>
						linkPromises.push(this.linkReservationPackage(reservationId, item))
					)
				)
			);
		}
		return Promise.all(linkPromises).then(() => this.getById(reservationId));
	}

	async completeReservation(confirmationCode: string): Promise<Model.Reservation> {
		await this.db.runQuery(
			'UPDATE reservation SET completedOn=CURRENT_TIMESTAMP() WHERE externalConfirmationId=?;',
			[confirmationCode]
		);
		return this.db.queryOne('SELECT * FROM reservation WHERE externalConfirmationId = ?;', [confirmationCode]);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	): Promise<RedSky.RsPagedResponseData<Api.Reservation.Res.Get[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageOffset = Math.ceil((pagination.page - 1) * pagination.perPage);
		let allObjects = await this.db.runQuery(
			`${this.reservationDetailQuery()}
			WHERE
				(${pageQuery.filterQuery})
				GROUP BY reservation.id
				${pageQuery.sortQuery} 
			LIMIT ?
			OFFSET ?; 
			SELECT Count(id) as total FROM reservation WHERE (${pageQuery.filterQuery});`,
			[pagination.perPage, pageOffset]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	async getById(reservationId: number): Promise<Api.Reservation.Res.Get> {
		return this.db.queryOne(
			`${this.reservationDetailQuery()}
			WHERE reservation.id=?
			GROUP BY reservation.id;`,
			[reservationId]
		);
	}

	getModelById(reservationId: number): Promise<Model.Reservation> {
		return this.db.queryOne('SELECT * FROM reservation WHERE id=?;', [reservationId]);
	}

	async getUpcomingReservations(details: UpcomingReservation): Promise<Api.Reservation.Res.Upcoming[]> {
		const limit = details.limit || 1;
		return this.db.runQuery(
			`${this.reservationDetailQuery()}
			WHERE reservation.arrivalDate > NOW()
			  AND reservation.externalCancellationId IS NULL
			  AND reservation.userId=?
			GROUP BY reservation.id
			ORDER BY reservation.arrivalDate ASC
			LIMIT ?;`,
			[details.userId, limit]
		);
	}

	async getItineraryByReservationId(reservationId: number): Promise<Api.Reservation.Res.Itinerary.Get> {
		const itinerary: Api.Reservation.Res.Itinerary.Get = await this.getItineraryDetails(reservationId);
		const stays: Api.Reservation.Res.Itinerary.Stay[] = await this.getStaysByItinerary(
			itinerary.itineraryId,
			itinerary.parentReservationId
		);
		itinerary.stays = stays;
		return itinerary;
	}

	async getItinerary(itineraryId: string): Promise<Api.Reservation.Res.Itinerary.Get> {
		const stays: Api.Reservation.Res.Itinerary.Stay[] = await this.getStaysByItinerary(itineraryId);
		if (!!!stays.length) throw new RsError('BAD_REQUEST', 'No stays found for this itinerary');
		const itinerary: Api.Reservation.Res.Itinerary.Get = await this.getItineraryDetails(stays[0].reservationId);
		itinerary.stays = stays;
		return itinerary;
	}

	async getItinerariesByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	): Promise<RedSky.RsPagedResponseData<Api.Reservation.Res.Itinerary.Get[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageOffset = Math.ceil((pagination.page - 1) * pagination.perPage);
		const result = await this.db.runQuery(
			`${Reservation.itineraryDetailsQuery}
			WHERE
			reservation.externalCancellationId IS NULL AND
				${pageQuery.filterQuery}
				GROUP BY reservation.itineraryId
				${pageQuery.sortQuery}
			LIMIT ?
			OFFSET ?;
			SELECT Count(DISTINCT itineraryId) as total FROM reservation WHERE ${pageQuery.filterQuery};
		`,
			[pagination.perPage, pageOffset]
		);
		let total = 0;
		total = result[1][0].total;
		return { data: result[0], total };
	}

	async getReservationBlock(
		destinationId: number,
		startDate: Date,
		daysInBlock: number
	): Promise<Model.Reservation[]> {
		return this.db.runQuery(
			`SELECT * FROM reservation 
				WHERE destinationId=?
				AND arrivalDate >=? 
				AND arrivalDate < DATE_ADD(?,INTERVAL ? DAY);`,
			[destinationId, startDate, startDate, daysInBlock]
		);
	}

	async cancel(reservationId: number, externalCancellationId: string): Promise<number> {
		await this.db.runQuery(
			'UPDATE reservation SET externalCancellationId=?, canceledOn=CURRENT_TIMESTAMP() WHERE id=?;',
			[externalCancellationId, reservationId]
		);
		return reservationId;
	}

	async updatePaymentMethod(reservationId: number, paymentMethodId: number): Promise<Api.Reservation.Res.Get> {
		const updatedResponse = await this.db.runQuery('UPDATE reservation SET userPaymentMethodId=? WHERE id=?', [
			paymentMethodId,
			reservationId
		]);
		if (updatedResponse.affectedRows > 0) return this.getById(reservationId);
		logger.error('Failed to update userPaymentMethod', { reservationId, paymentMethodId });
		throw new RsError('BAD_REQUEST', 'Failed to update reservation userPaymentMethodId');
	}

	/***
	 * This method is not included in the interface so that it's not accessible to services, only to tests using the class directly.
	 */
	async deleteForTest(reservationId: number): Promise<number> {
		await this.unlinkReservationPackages(reservationId);
		return super.delete(reservationId);
	}

	/***
	 * This method is not included in the interface so that it's not accessible to services, only to tests using the class directly.
	 */
	async deleteManyForTest(reservationIds: number[]): Promise<number[]> {
		await this.db.runQuery('DELETE FROM reservationUpsellPackage WHERE reservationId IN (?);', [reservationIds]);
		const childReservations = await this.db.runQuery(
			'DELETE FROM `reservation` WHERE `id` IN (?) AND parentReservationId IS NOT NULL;',
			[reservationIds]
		);
		const parentReservations = await this.db.runQuery('DELETE FROM `reservation` WHERE `id` IN (?);', [
			reservationIds
		]);
		return childReservations.affectedRows + parentReservations.affectedRows;
	}

	private async linkReservationPackage(reservationId: number, upsellPackage: ReservationUpsellPackageToSave) {
		await this.db.runQuery(
			'INSERT INTO reservationUpsellPackage (reservationId,upsellPackageId,priceDetail) VALUES (?,?,?)',
			[reservationId, upsellPackage.upsellPackageId, JSON.stringify(upsellPackage.priceDetail)]
		);
	}

	private async unlinkReservationPackages(reservationId: number) {
		await this.db.runQuery('DELETE FROM reservationUpsellPackage WHERE reservationId=?;', [reservationId]);
	}

	private reservationDetailQuery() {
		return mysql.format(
			`SELECT reservation.id,
				reservation.userId,
				paymentMethodDetails.paymentAddress AS billingAddress,
				paymentMethodDetails.paymentMethod,
				${Reservation.concatenateDestinationDetailObject} AS destination,
				${Reservation.concatenateAccommodationDetailObject}  AS accommodation,
				guest.guest,
				reservation.arrivalDate,
				reservation.departureDate,
				reservation.status,
				reservation.canceledOn,
				reservation.rateCode,
				reservation.externalReservationId,
				reservation.externalConfirmationId,
				reservation.externalCancellationId,
				reservation.externalCancelNumber,
				reservation.adultCount,
				reservation.childCount,
				reservation.confirmationDate,
				reservation.nightCount,
				reservation.priceDetail,
				reservation.itineraryId,
				reservation.cancellationPermitted,
				reservation.additionalDetails,
				${Reservation.concatenateUpsellPackageArray} AS upsellPackages
            FROM reservation
                # paymentMethod and billingAddress
			    LEFT JOIN(${Reservation.paymentAndBillingQuery}) paymentMethodDetails
             		ON paymentMethodDetails.id=reservation.userPaymentMethodId
                # Destination
                JOIN (${Reservation.destinationDetailQuery}) AS reservationDestination 
				 	ON reservationDestination.id=reservation.destinationId
                # Accommodation
                JOIN (${Reservation.accommodationDetailQuery}) reservationAccommodation
					ON reservationAccommodation.id=reservation.accommodationId
				# Upsell packages
				LEFT JOIN(${Reservation.upsellPackageSubquery}) AS reservationPackage
					ON reservation.id=reservationPackage.reservationId
				JOIN (SELECT
						reservation.id AS reservationId,
						${Reservation.concatenateGuestObject}
					 FROM reservation
					 GROUP BY reservation.id
				) AS guest
					ON reservation.id = guest.reservationId`,

			[]
		);
	}

	private getItineraryDetails(reservationId: number): Promise<Api.Reservation.Res.Itinerary.Get> {
		return this.db.queryOne(`${Reservation.itineraryDetailsQuery} WHERE reservation.id=?`, [reservationId]);
	}

	private getStaysByItinerary(
		itineraryId: string,
		parentReservationId?: number
	): Promise<Api.Reservation.Res.Itinerary.Stay[]> {
		const idQuery = !!parentReservationId
			? mysql.format('AND (reservation.parentReservationId=? OR reservation.id=?)', [
					parentReservationId,
					parentReservationId
			  ])
			: '';
		return this.db.runQuery(
			`SELECT
				reservation.id AS reservationId,
				reservation.arrivalDate,
				reservation.departureDate,
				reservation.status,
				reservation.canceledOn,
       			reservation.rateCode,
				reservation.externalReservationId,
				reservation.externalCancellationId,
				reservation.externalConfirmationId,
				reservation.adultCount,
				reservation.childCount,
				reservation.confirmationDate,
				reservation.nightCount,
				reservation.priceDetail,
				reservation.cancellationPermitted,
				CONCAT('{"id":',review.id,',"rating":',review.rating,',"message":"',review.message,'"}') review,
				${Reservation.concatenateAccommodationDetailObject}  AS accommodation,
				guest.guest,
				${Reservation.concatenateUpsellPackageArray} AS upsellPackages,
				reservation.additionalDetails
			FROM reservation
				# Accommodation
				JOIN (${Reservation.accommodationDetailQuery}) AS reservationAccommodation
					ON reservationAccommodation.id=reservation.accommodationId
				# Upsell Packages
				LEFT JOIN(${Reservation.upsellPackageSubquery}) AS reservationPackage
					ON reservation.id=reservationPackage.reservationId
				JOIN (SELECT
					reservation.id AS reservationId,
					${Reservation.concatenateGuestObject}
					FROM reservation
					GROUP BY reservation.id
				) AS guest
					ON reservation.id = guest.reservationId
				# Review
				LEFT JOIN review ON review.reservationId = reservation.id
			WHERE reservation.itineraryId=?
				AND externalCancellationId IS NULL
				${idQuery}
			GROUP BY reservation.id;`,
			[itineraryId]
		);
	}

	private static readonly concatenateDestinationDetailObject = `
			CONCAT(
				'{
					"id":', reservationDestination.id,
					',"externalId":"', reservationDestination.externalSystemId,
					'","companyId":',reservationDestination.companyId,
					',"name":"', reservationDestination.name,
					'","description":"', IFNULL(reservationDestination.description, ''),
					'","status":"', IFNULL(reservationDestination.status, ''),
					'","address1":"', IFNULL(reservationDestination.address1, ''),
					'","address2":"', IFNULL(reservationDestination.address2, ''),
					'","city":"', IFNULL(reservationDestination.city, ''),
					'","state":"', IFNULL(reservationDestination.state, ''),
					'","zip":"', IFNULL(reservationDestination.zip, ''),
					'","country":"', IFNULL(reservationDestination.country, ''),
					'","packages":', IFNULL(reservationDestination.packages, '[]'),
					',"logoUrl":"', IFNULL(reservationDestination.logoUrl, ''),
					'","heroUrl":"', IFNULL(reservationDestination.heroUrl, ''),
					'","policies":', reservationDestination.policies,
					',"experiences":', reservationDestination.experiences,
					',"media":', IFNULL(reservationDestination.media,'${Table.mediaNotFoundObject}'),
				'}'
		)`;

	private static readonly destinationDetailQuery = `
		SELECT
			destination.id,
			destination.externalSystemId,
			destination.companyId,
			destination.name,
			IFNULL(destination.description,'') description,
			IFNULL(destination.status, '') status,
			IFNULL(destination.address1,'') address1,
			IFNULL(destination.address2,'') address2,
			IFNULL(destination.city,'') city,
			IFNULL(destination.state,'') state,
			IFNULL(destination.zip,'') zip,
			IFNULL(destination.country,'') country,
			IFNULL(destination.logoUrl,'') logoUrl,
			IFNULL(destination.heroUrl,'') heroUrl,
			IFNULL(dP.policies,'[]') AS policies,
		    IFNULL(packages.packages,'[]') AS packages,
			IFNULL(experiences.experiences, '[]') AS experiences,
			${Table.concatenateMediaArray}
		FROM destination
			LEFT JOIN (
				SELECT
					destinationPolicy.destinationId,
					CONCAT('[',
						GROUP_CONCAT(
							CONCAT(
								'{"type":"',destinationPolicy.policyType,
								'","value":"',destinationPolicy.value,
								'"}'
							)
						),
					']') AS policies
				FROM destinationPolicy
				GROUP BY destinationPolicy.destinationId
			) AS dP 
				ON destination.id = dP.destinationId
			LEFT JOIN mediaMap ON destination.id = mediaMap.destinationId
			LEFT JOIN media ON media.id = mediaMap.mediaId
			
			# destination.packages
			LEFT JOIN (
				SELECT 
					upsellPackage.destinationId AS destinationId,
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
						GROUP BY mediaMap.packageId
					) AS packageMedia
					ON packageMedia.packageId=upsellPackage.id
				GROUP BY destinationId
			) AS packages
			ON packages.destinationId=destination.id

			#destination.experiences
			LEFT JOIN(${Destination.destinationExperienceSubquery}) as experiences
				ON experiences.destinationId = destination.id
		GROUP BY destination.id`;

	private static readonly concatenateAccommodationDetailObject = `
		CONCAT(
			'{
				"id":', reservationAccommodation.id,
				',"name":"', reservationAccommodation.name,
				'","shortDescription":"', reservationAccommodation.shortDescription,
				'","longDescription":"', reservationAccommodation.longDescription,
				'","propertyType":"', reservationAccommodation.propertyType,
				'","featureIcons":', reservationAccommodation.featureIcons,
				',"address1":"', reservationAccommodation.address1,
				'","address2":"', reservationAccommodation.address2,
				'","city":"', reservationAccommodation.city,
				'","state":"', reservationAccommodation.state,
				'","zip":"', reservationAccommodation.zip,
				'","country":"', reservationAccommodation.country,
				'","roomCount":"', reservationAccommodation.roomCount,
				'","heroUrl":"', reservationAccommodation.heroUrl,
				'","maxOccupantCount":', reservationAccommodation.maxOccupantCount,
				',"maxSleeps":', reservationAccommodation.maxSleeps,
				',"floorCount":', reservationAccommodation.floorCount,
				',"extraBeds":', reservationAccommodation.extraBeds,
				',"adaCompliant":', reservationAccommodation.adaCompliant,
				',"media":', IFNULL(reservationAccommodation.media,'${Table.mediaNotFoundObject}'),
			'}'
		)`;

	private static readonly concatenateGuestObject = `
		GROUP_CONCAT(
			CONCAT(
				'{
					"firstName":"', IFNULL(reservation.guestFirstName, ''),
					'","lastName":"', IFNULL(reservation.guestLastName, ''),
					'","phone":"', IFNULL(reservation.guestPhone, ''),
					'","email":"', IFNULL(reservation.guestEmail, ''),
				'"}'
			)
		) AS guest
	`;

	private static readonly accommodationDetailQuery = `
		SELECT
			accommodation.id,
			accommodation.name,
			IFNULL(accommodation.shortDescription,'') shortDescription,
			IFNULL(accommodation.longDescription,'') longDescription,
			IFNULL(featureIcons.icons, '[]') featureIcons,
			IFNULL(accommodation.address1,'') address1,
			IFNULL(accommodation.address2,'') address2,
			IFNULL(accommodation.city,'') city,
			IFNULL(accommodation.state,'') state,
			IFNULL(accommodation.zip,'') zip,
			IFNULL(accommodation.country,'') country,
		    IFNULL(accommodation.roomCount, 1) roomCount,
			IFNULL(accommodation.heroUrl,'') heroUrl,
			IFNULL(accommodation.maxOccupantCount, 1) maxOccupantCount,
			IFNULL(accommodation.maxSleeps, 1) maxSleeps,
			IFNULL(accommodation.floorCount, 1) floorCount,
			accommodation.extraBeds,
			accommodation.adaCompliant,
			IFNULL(accommodationMedia.media,'${Table.mediaNotFoundObject}') media,
		    IFNULL(propertyType.name, '') propertyType
		FROM accommodation
			LEFT JOIN (
				SELECT
					feature.accommodationId,
					CONCAT('[',SUBSTRING_INDEX(GROUP_CONCAT(CONCAT('"',feature.icon,'"')), ',', 5),']') AS icons
				FROM feature
				WHERE feature.accommodationId
				GROUP BY feature.accommodationId
			) AS featureIcons 
				ON featureIcons.accommodationId=accommodation.id
			LEFT JOIN (${Accommodation.accommodationMediaSubquery}) AS accommodationMedia
				ON accommodationMedia.accommodationId=accommodation.id
			LEFT JOIN propertyType on propertyType.id = accommodation.propertyTypeId
		GROUP BY accommodation.id`;

	private static readonly paymentAndBillingQuery = `
		SELECT
			userPaymentMethod.id,
			GROUP_CONCAT(
				CONCAT(
					'{"id":',userPaymentMethod.id,
					',"userAddressId":',IFNULL(userPaymentMethod.userAddressId,0),
					',"nameOnCard":"',userPaymentMethod.nameOnCard,
					'","type":"',userPaymentMethod.type,
					'","last4":',userPaymentMethod.last4,
					',"expirationMonth":',userPaymentMethod.expirationMonth,
					',"expirationYear":',userPaymentMethod.expirationYear,
					',"cardNumber":"',userPaymentMethod.cardNumber,
					'","isPrimary":',userPaymentMethod.isPrimary,
					',"createdOn":"',userPaymentMethod.createdOn,
					'","systemProvider":"',userPaymentMethod.systemProvider,
					'"}'
				)
			) AS paymentMethod,
			GROUP_CONCAT(
				CONCAT(
					'{"address1":"',uA.address1,
					'","address2":"',IFNULL(uA.address2,''),
					'","city":"',uA.city,
					'","state":"',uA.state,
					'","zip":"',IFNULL(uA.zip,''),
					'","country":"',IFNULL(uA.country,''),
					'"}'
				)
			) AS paymentAddress
		FROM userPaymentMethod
			LEFT JOIN userAddress uA on userPaymentMethod.userAddressId = uA.id
		GROUP BY userPaymentMethod.id`;

	private static readonly concatenateUpsellPackageArray: string = `
		IFNULL(
			CONCAT('[',
				GROUP_CONCAT(
					CONCAT(
						'{"id":', reservationPackage.upsellPackageId,
						',"title":"', reservationPackage.title,
						'","description":"', reservationPackage.description,
						'","code":"', reservationPackage.code,
						'","media":', reservationPackage.media,
						',"priceDetail":', reservationPackage.priceDetail,
						'}'
					)
				),
			']'),
		'[]')`;

	private static readonly concatenateStaysArray: string = `
	 CONCAT(
            '[',GROUP_CONCAT ('{
                "reservationId":',reservation.id,
                              ',"accommodation":',
                              CONCAT(
                                      '{
                                      "id":', reservationAccommodation.id,
                                      ',"name":"', reservationAccommodation.name,
                                      '","shortDescription":"', reservationAccommodation.shortDescription,
                                      '","longDescription":"', reservationAccommodation.longDescription,
                                      '","propertyType":"', reservationAccommodation.propertyType,
                                      '","featureIcons":', reservationAccommodation.featureIcons,
                                      ',"address1":"', reservationAccommodation.address1,
                                      '","address2":"', reservationAccommodation.address2,
                                      '","city":"', reservationAccommodation.city,
                                      '","state":"', reservationAccommodation.state,
                                      '","zip":"', reservationAccommodation.zip,
                                      '","country":"', reservationAccommodation.country,
                                      '","roomCount":"', reservationAccommodation.roomCount,
                                      '","heroUrl":"', reservationAccommodation.heroUrl,
                                      '","maxOccupantCount":', reservationAccommodation.maxOccupantCount,
                                      ',"maxSleeps":', reservationAccommodation.maxSleeps,
                                      ',"floorCount":', reservationAccommodation.floorCount,
                                      ',"extraBeds":', reservationAccommodation.extraBeds,
                                      ',"adaCompliant":', reservationAccommodation.adaCompliant,
                                      ',"media":', IFNULL(reservationAccommodation.media,'${Table.mediaNotFoundObject}'),
                                      '}'
                                  ),
                              ',"arrivalDate":"', reservation.arrivalDate,
                              '","departureDate":"',reservation.departureDate,
                              '","status":"', reservation.status,
                              '","canceledOn":"', IFNULL(reservation.canceledOn, ''),
                              '","rateCode":"', IFNULL(reservation.rateCode, ''),
                              '","externalReservationId":"', reservation.externalReservationId,
                              '","externalCancellationId":"', IFNULL(reservation.externalCancellationId, ''),
                              '","guest":', CONCAT(
                                      '{
          							  "firstName":"', IFNULL(reservation.guestFirstName, ''),
                                      '","lastName":"', IFNULL(reservation.guestLastName, ''),
                                      '","phone":"', IFNULL(reservation.guestPhone, ''),
                                      '","email":"', IFNULL(reservation.guestEmail, ''),
                                      '"}'
                                  ),
                              ',"adultCount":', reservation.adultCount,
                              ',"childCount":', reservation.childCount,
                              ',"externalConfirmationId":"', reservation.externalConfirmationId,
                              '","confirmationDate":"', reservation.confirmationDate,
                              '","upsellPackages":', IFNULL(reservationPackage.upsellPackages, '[]'),
                              ',"priceDetail":', reservation.priceDetail,
                              ',"cancellationPermitted":', reservation.cancellationPermitted,
                              ',"review":',IFNULL(CONCAT('{"id":',review.id,',"rating":',review.rating,',"message":"',review.message,'"}'), '{}'),
                              ',"additionalDetails":"', IFNULL(reservation.additionalDetails, ''),
                              '"}'
        ), ']'
        )
        `;

	private static readonly upsellPackageSubquery: string = `
		SELECT
			packageLink.reservationId,
			packageLink.upsellPackageId,
			package.title,
			package.description,
			package.code,
			packageLink.priceDetail,
			package.media
		FROM reservationUpsellPackage AS packageLink
			JOIN (
				SELECT
					upsellPackage.id,
					upsellPackage.title,
					upsellPackage.description,
					upsellPackage.code,
					${Table.concatenateMediaArray}
				FROM upsellPackage
					LEFT JOIN mediaMap ON mediaMap.packageId=upsellPackage.id
					LEFT JOIN media ON mediaMap.mediaId=media.id
				GROUP BY upsellPackage.id
			) AS package ON package.id=packageLink.upsellPackageId`;

	private static readonly itineraryDetailsQuery: string = `
	SELECT
    IFNULL(reservation.parentReservationId, reservation.id) AS parentReservationId,
	reservation.userId AS userId,
    reservation.itineraryId,
    paymentMethodDetails.paymentAddress AS billingAddress,
    paymentMethodDetails.paymentMethod AS paymentMethod,
    ${Reservation.concatenateDestinationDetailObject}  AS destination,
   ${Reservation.concatenateStaysArray} as stays
FROM reservation
         # paymentMethod and billingAddress
         LEFT JOIN(
    ${Reservation.paymentAndBillingQuery}) AS paymentMethodDetails
                  ON paymentMethodDetails.id=reservation.userPaymentMethodId
         JOIN (${Reservation.destinationDetailQuery}) reservationDestination
              ON reservationDestination.id=reservation.destinationId
         JOIN (${Reservation.accommodationDetailQuery}) reservationAccommodation
              ON reservationAccommodation.id=reservation.accommodationId
         LEFT JOIN(
    SELECT
        packageLink.reservationId,
        IFNULL(CONCAT('[',
                      GROUP_CONCAT(
                              CONCAT(
                                      '{"id":', package.id,
                                      ',"title":"', package.title,
                                      '","description":"', IFNULL(package.description,''),
                                      '","code":"', package.code,
                                      '","media":', IFNULL(package.media,'${Table.mediaNotFoundObject}'),
                                      ',"priceDetail":', IFNULL(packageLink.priceDetail, '{}'),
                                      '}'
                                  )
                          ),
                      ']'),'[]') upsellPackages
    FROM reservationUpsellPackage AS packageLink
             JOIN (
        SELECT
            upsellPackage.id,
            upsellPackage.title,
            upsellPackage.description,
            upsellPackage.code,
            IFNULL(
                    CONCAT('[',
                           GROUP_CONCAT(
                                   CONCAT(
                                           '{',
                                           '"id":',media.id,
                                           ',"uploaderId":', media.uploaderId,
                                           ',"type":"', media.type,
                                           '","urls":', media.urls,
                                           ',"title":"', IFNULL(media.title,''),
                                           '","description":"', IFNULL(media.description,''),
                                           '","isPrimary":', media.isPrimary,
                                           '}'
                                       )),
                           ']'),
                    '[]') AS media
        FROM upsellPackage
                 LEFT JOIN mediaMap ON mediaMap.packageId=upsellPackage.id
                 LEFT JOIN media ON mediaMap.mediaId=media.id
        GROUP BY upsellPackage.id
    ) AS package ON package.id=packageLink.upsellPackageId
    GROUP BY packageLink.reservationId) AS reservationPackage
                  ON reservation.id=reservationPackage.reservationId
         LEFT JOIN review on review.reservationId=reservation.id
	`;

	delete: null;
	deleteMany: null;
}

export const reservation = (dbArgs) => {
	dbArgs.tableName = 'reservation';
	return new Reservation(dbArgs);
};
