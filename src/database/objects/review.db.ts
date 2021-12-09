import Table from '../Table';
import IReviewTable, { ComprehensiveReviewDetails } from '../interfaces/IReviewTable';
import mysql from 'mysql';
import { ObjectUtils } from '../../utils/utils';
import { company } from './company.db';

export default class Review extends Table implements IReviewTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getForDestination(
		destinationId: number,
		status: Model.ReviewStatus | 'ALL' = 'APPROVED'
	): Promise<Api.Review.Res.ForDestination> {
		const statusQueryString = status === 'ALL' ? 'TRUE' : `review.status='${status}'`;
		return this.db.queryOne(
			`WITH destinationDetails AS (
                SELECT id, GROUP_CONCAT(CONCAT('{"id":', id, ',"name":"', name, '"}')) destinationDetail
                FROM destination
                GROUP BY destination.id
            ),
                  accommodationDetails AS (
                      SELECT id, GROUP_CONCAT(CONCAT('{"id":', id, ',"name":"', name, '"}')) accommodationDetail
                      FROM accommodation
                      GROUP BY accommodation.id
                  ),
                  guestDetails AS (
                      SELECT id,
                             GROUP_CONCAT(CONCAT('{"id":', id, ',"firstName":"', firstName, '","lastName":"', lastName,
                                                 '","primaryEmail":"', primaryEmail, '","phone":"', IFNULL(phone, ''),
                                                 '","accountNumber":"', IFNULL(accountNumber,''), '"}')) guest
                      FROM user
                      GROUP BY user.id
                  ),
                  packageDetails AS (
                      SELECT reservationId,
                             CONCAT('[', GROUP_CONCAT(CONCAT('{"id":', id, ',"name":"', title, '"}')),
                                    ']') packageDetail
                      FROM reservationUpsellPackage
                               JOIN upsellPackage ON upsellPackage.id = reservationUpsellPackage.upsellPackageId
                      GROUP BY reservationId
                  ),
                  destinationReviews AS (
                      SELECT destinationId,
                             IFNULL(CONCAT('[', GROUP_CONCAT(
                                     CONCAT('{"id":', review.id,',"guest":',
                                            guestDetails.guest, ',"accommodation":',
                                            accommodationDetails.accommodationDetail, ',"packages":',
                                            IFNULL(packageDetails.packageDetail, '[]'), ',"message":"', review.message, '","rating":',
                                            review.rating, ',"createdOn":"', review.createdOn, '","modifiedOn":"',
                                            IFNULL(review.modifiedOn, ''), '","verifiedOn":"',
                                            IFNULL(review.verifiedOn, ''), '","status":"', review.status,
                                            '","stayStartDate":"', review.stayStartDate, '","stayEndDate":"',
                                            review.stayEndDate, '"}')), ']'), '[]') reviews
                      FROM review
                               JOIN destinationDetails ON destinationDetails.id = review.destinationId
                               JOIN accommodationDetails ON accommodationDetails.id = review.accommodationId
                               JOIN guestDetails ON guestDetails.id = review.userId
                               LEFT JOIN packageDetails ON packageDetails.reservationId = review.reservationId
                      WHERE ${statusQueryString}
                      GROUP BY destinationId
                  )
             Select name,
                    description,
                    code,
                    status,
                    logoUrl,
                    heroUrl,
                    reviewRating,
                    reviewCount,
                    IFNULL(destinationReviews.reviews, '[]') reviews
             FROM destination
                     LEFT JOIN destinationReviews ON destination.id = destinationReviews.destinationId
             WHERE destination.id = ?
             GROUP BY destination.id;`,
			[destinationId]
		);
	}

	async getByDestinationId(
		destinationId: number,
		status: Model.ReviewStatus | 'ALL' = 'APPROVED'
	): Promise<ComprehensiveReviewDetails[]> {
		const statusQueryString = status === 'ALL' ? 'TRUE' : `review.status='${status}'`;
		return this.db.runQuery(
			`${Review.detailsBaseRequest()}
             WHERE review.destinationId = ?
               AND ${statusQueryString};`,
			[destinationId]
		);
	}

	getById(reviewId: number, companyId?: number): Promise<ComprehensiveReviewDetails> {
		let companyQuery = companyId ? mysql.format('AND destination.companyId = ?', [companyId]) : '';
		return this.db.queryOne(
			`${Review.detailsBaseRequest()}
			JOIN destination ON destination.id = review.destinationId
			WHERE review.id=? ${companyQuery};`,
			[reviewId]
		);
	}

	getByReservation(reservationId: number): Promise<Api.Review.Res.Get> {
		return this.db.queryOne('SELECT * FROM review WHERE reservationId = ? LIMIT 1;', [reservationId]);
	}

	getForUser(userId: number): Promise<ComprehensiveReviewDetails[]> {
		return this.db.runQuery(
			`${Review.detailsBaseRequest()}
             WHERE review.userId = ?;`,
			[userId]
		);
	}

	getComprehensiveReviewById(createdReviewId: number): Promise<ComprehensiveReviewDetails> {
		return this.db.queryOne(
			`${Review.detailsBaseRequest()}
			WHERE review.id=?;`,
			[createdReviewId]
		);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId: number
	): Promise<RedSky.RsPagedResponseData<ComprehensiveReviewDetails[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		let allObjects = await this.db.runQuery(
			`${Review.detailsBaseRequest()}
			 WHERE
			 (${pageQuery.filterQuery})
			 ${pageQuery.sortQuery} 
			 LIMIT ?
			 OFFSET ?; ${Review.detailsBaseCte()} SELECT Count(review.id) as total FROM review
                         JOIN destinationDetails ON destinationDetails.id = review.destinationId
                         JOIN accommodationDetails ON accommodationDetails.id = review.accommodationId
                         JOIN guestDetails ON guestDetails.id = review.userId
                         LEFT JOIN packageDetails ON packageDetails.reservationId = review.reservationId 
                         WHERE (${pageQuery.filterQuery});`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	static detailsBaseCte() {
		return `WITH destinationDetails AS (
            SELECT id, GROUP_CONCAT(CONCAT('{"id":', id, ',"name":"', name, '"}')) destinationDetail
            FROM destination
            GROUP BY destination.id
        ),
                     accommodationDetails AS (
                         SELECT id, GROUP_CONCAT(CONCAT('{"id":', id, ',"name":"', name, '"}')) accommodationDetail
                         FROM accommodation
                         GROUP BY accommodation.id
                     ),
                     guestDetails AS (
                         SELECT id, accountNumber, firstName, lastName,
                                GROUP_CONCAT(
                                        CONCAT('{"id":', id, ',"firstName":"', firstName, '","lastName":"', lastName,
                                               '","primaryEmail":"', primaryEmail, '","phone":"', IFNULL(phone, ''),
                                               '","accountNumber":"', IFNULL(accountNumber,''), '"}')) guest
                         FROM user
                         GROUP BY user.id
                     ),
                     packageDetails AS (
                         SELECT reservationId,
                                IFNULL(CONCAT('[', GROUP_CONCAT(CONCAT('{"id":', id, ',"name":"', title, '"}')),
                                       ']'),'[]') packageDetail
                         FROM reservationUpsellPackage
                                  JOIN upsellPackage ON upsellPackage.id = reservationUpsellPackage.upsellPackageId
                         GROUP BY reservationId
                     )`;
	}

	static detailsBaseRequest() {
		return `${Review.detailsBaseCte()}
                SELECT review.id,
                       guestDetails.guest,
                       destinationDetails.destinationDetail     destination,
                       accommodationDetails.accommodationDetail accommodation,
                       packageDetails.packageDetail,
                       review.reservationId,
                       review.message,
                       review.rating,
                       review.createdOn,
                       review.modifiedOn,
                       review.verifiedOn,
                       review.status,
                       review.stayStartDate,
                       review.stayEndDate
                FROM review
                         JOIN destinationDetails ON destinationDetails.id = review.destinationId
                         JOIN accommodationDetails ON accommodationDetails.id = review.accommodationId
                         JOIN guestDetails ON guestDetails.id = review.userId
                         LEFT JOIN packageDetails ON packageDetails.reservationId = review.reservationId`;
	}
}

export const review = (dbArgs) => {
	dbArgs.tableName = 'review';
	return new Review(dbArgs);
};
