import { Service } from '../Service';
import IReviewTable, { ComprehensiveReviewDetails, Create, Update } from '../../database/interfaces/IReviewTable';
import IDestinationTable from '../../database/interfaces/IDestinationTable';
import { DateUtils, ObjectUtils } from '../../utils/utils';
import { RsError } from '../../utils/errors';
import EmailService from '../email/email.service';
import { ServiceName } from '../serviceFactory';
import { EmailReplyType, EmailSendImmediate, EmailType } from '../email/IEmailService';
import IUserTable from '../../database/interfaces/IUserTable';
import CompanyService from '../company/company.service';
import IReservationTable from '../../database/interfaces/IReservationTable';

export default class ReviewService extends Service {
	private emailService: EmailService;

	constructor(
		private readonly reviewTable: IReviewTable,
		private readonly destinationTable: IDestinationTable,
		private readonly userTable: IUserTable,
		private readonly reservationTable: IReservationTable
	) {
		super();
	}

	start(services: Partial<Record<ServiceName, Service>>) {
		this.emailService = services['EmailService'] as EmailService;
	}

	getById(reviewId: number): Promise<Api.Review.Res.Get> {
		return this.reviewTable.getById(reviewId);
	}

	getByReservation(reservationId: number): Promise<Api.Review.Res.Get> {
		return this.reviewTable.getByReservation(reservationId);
	}

	async getForDestination(destinationId: number): Promise<Api.Review.Res.ForDestination> {
		let destinationReviews: Api.Review.Res.ForDestination = await this.reviewTable.getForDestination(destinationId);
		destinationReviews.reviews = ObjectUtils.sort<Omit<Api.Review.Details, 'destination'>>(
			destinationReviews.reviews,
			'createdOn',
			true
		);
		return destinationReviews;
	}

	getAllForDestination(destinationId: number): Promise<Api.Review.Res.ForDestination> {
		return this.reviewTable.getForDestination(destinationId, 'ALL');
	}

	getForUser(userId: number): Promise<Api.Review.Res.Get[]> {
		return this.reviewTable.getForUser(userId);
	}

	getByPage({
		pagination,
		sort,
		filter
	}: RedSky.PageQuery): Promise<RedSky.RsPagedResponseData<Api.Review.Res.Get[]>> {
		return this.reviewTable.getByPage(pagination, sort, filter);
	}

	async create(createDetails: Omit<Create, 'status'>): Promise<Api.Review.Res.Create> {
		const reservation: Model.Reservation = await this.reservationTable.getModelById(createDetails.reservationId);
		const reviewToCreate: Omit<
			Model.Review,
			'id' | 'verifyUserId' | 'createdOn' | 'modifiedOn' | 'verifiedOn'
		> = this.formatReviewToCreate(createDetails, reservation);
		const createdReview: ComprehensiveReviewDetails = await this.reviewTable.create(reviewToCreate);
		this.sendReviewCreateEmail(createdReview.id);
		await this.updateDestinationReviews(createdReview.destination.id);
		return createdReview;
	}

	async verify(reviewId: number, verifiedByUserId: number, companyId: number): Promise<Api.Review.Res.Update> {
		const reviewToUpdate: ComprehensiveReviewDetails = await this.reviewTable.getById(reviewId, companyId);
		if (reviewToUpdate.status !== 'PENDING') throw new RsError('FORBIDDEN', 'Review has already been verified');
		return this.update({
			id: reviewId,
			status: 'APPROVED',
			verifiedOn: DateUtils.dbNow(),
			verifyUserId: verifiedByUserId
		});
	}

	async update(updateDetails: Update): Promise<Api.Review.Res.Update> {
		const reviewToUpdate: ComprehensiveReviewDetails = await this.reviewTable.getById(updateDetails.id);
		if ('status' in updateDetails) {
			if (reviewToUpdate.status === 'PENDING' && !updateDetails.verifyUserId)
				throw new RsError('FORBIDDEN', 'This review has not yet been verified');
		}
		await this.updateDestinationReviews(reviewToUpdate.destination.id);
		return this.reviewTable.update(updateDetails.id, updateDetails);
	}

	async delete(reviewId: number): Promise<number> {
		const reviewToRemove: ComprehensiveReviewDetails = await this.reviewTable.getById(reviewId);
		await this.reviewTable.delete(reviewId);
		await this.updateDestinationReviews(reviewToRemove.destination.id);
		return reviewId;
	}

	private async updateDestinationReviews(destinationId: number): Promise<void> {
		const destinationReviews: ComprehensiveReviewDetails[] = await this.reviewTable.getByDestinationId(
			destinationId
		);
		const averageReviewRating = this.calcAverageReviewRating(destinationReviews);
		await this.destinationTable.update(destinationId, {
			reviewRating: averageReviewRating,
			reviewCount: destinationReviews.length
		});
	}

	private async sendReviewCreateEmail(createdReviewId: number): Promise<void> {
		const adminUsers: Model.User[] = await this.userTable.getUsersByAccessScope('ADMINISTRATION');
		const comprehensiveReviewDetails: ComprehensiveReviewDetails = await this.reviewTable.getComprehensiveReviewById(
			createdReviewId
		);
		const emailObj: EmailSendImmediate = {
			templateType: EmailType.REVIEW_CREATE,
			emailReplyType: EmailReplyType.DEFAULT,
			metaData: {
				guestFirstName: comprehensiveReviewDetails.guest.firstName,
				destinationName: comprehensiveReviewDetails.destination.name,
				accommodationName: comprehensiveReviewDetails.accommodation?.name || '',
				reviewBlock: comprehensiveReviewDetails.message,
				adminUrl: CompanyService.getAdminUrl()
			}
		};
		for (let user of adminUsers) {
			const updatedEmailObject: EmailSendImmediate = { ...emailObj, recipientEmail: user.primaryEmail };
			updatedEmailObject.metaData.firstName = user.firstName;
			await this.emailService.sendImmediate(updatedEmailObject);
		}
	}

	private calcAverageReviewRating(reviews: ComprehensiveReviewDetails[] | Model.Review[]): number {
		let sum = 0;
		if (!reviews.length) return 5;
		for (const review of reviews) {
			sum += review.rating;
		}
		return Number((sum / reviews.length).toPrecision(3));
	}

	private formatReviewToCreate(
		createDetails: Omit<Create, 'status'>,
		reservation: Model.Reservation
	): Omit<Model.Review, 'id' | 'verifyUserId' | 'createdOn' | 'modifiedOn' | 'verifiedOn'> {
		return {
			status: 'PENDING',
			...createDetails,
			reservationId: reservation.id,
			destinationId: reservation.destinationId,
			accommodationId: reservation.accommodationId,
			stayStartDate: DateUtils.clientToServerDate(reservation.arrivalDate as Date),
			stayEndDate: DateUtils.clientToServerDate(reservation.departureDate as Date)
		};
	}
}
