import chai from 'chai';
import ReviewService from '../../services/review/review.service';
import reviewResource from '../resources/review.service.resource';
import { ComprehensiveReviewDetails } from '../../database/interfaces/IReviewTable';
import reservationResource from '../resources/reservation.service.resource';

describe('Review Service', function () {
	let createdReview: ComprehensiveReviewDetails;
	let reviewService: ReviewService;
	before(async () => {
		reviewService = new ReviewService(
			reviewResource.reviewTableMock,
			reviewResource.destinationTableMock,
			reviewResource.userTableMock,
			reservationResource.reservationTable
		);
	});

	describe('Create', function () {
		it('should create a review', async function () {
			const create: ComprehensiveReviewDetails = await reviewService.create(reviewResource.create);
			chai.expect(create).to.exist;
			chai.expect(create).to.haveOwnProperty('id').and.be.a('number');
			chai.expect(create).to.haveOwnProperty('guest').and.be.a('object');
			chai.expect(create.guest).to.haveOwnProperty('id').and.be.a('number');
			chai.expect(create.guest).to.haveOwnProperty('firstName').and.be.a('string');
			chai.expect(create.guest).to.haveOwnProperty('lastName').and.be.a('string');
			chai.expect(create.guest).to.haveOwnProperty('primaryEmail').and.be.a('string');
			chai.expect(create.guest).to.haveOwnProperty('accountNumber').and.be.a('string');
			chai.expect(create).to.haveOwnProperty('destination').and.be.a('object');
			chai.expect(create.destination).to.haveOwnProperty('id').and.be.a('number');
			chai.expect(create.destination).to.haveOwnProperty('name').and.be.a('string');
			chai.expect(create).to.haveOwnProperty('accommodation').and.be.a('object');
			chai.expect(create.accommodation).to.haveOwnProperty('id').and.be.a('number');
			chai.expect(create.accommodation).to.haveOwnProperty('name').and.be.a('string');
			chai.expect(create).to.haveOwnProperty('status').and.equal('PENDING');
			chai.expect(create).to.haveOwnProperty('rating').and.be.a('number');
			chai.expect(create).to.haveOwnProperty('packages').and.be.an('array');
			createdReview = create;
		});
	});

	describe('Update', function () {
		before(function () {
			if (!!!createdReview) this.skip();
		});
		it('should update a review', async function () {
			const updatedReview: ComprehensiveReviewDetails = await reviewService.update({
				id: createdReview.id,
				...reviewResource.update
			});
			chai.expect(updatedReview.message).to.equal(reviewResource.update.message);
			chai.expect(updatedReview.rating).to.equal(reviewResource.update.rating);
			createdReview = updatedReview;
		});
		it('should verify a review', async function () {
			const verifiedReview: ComprehensiveReviewDetails = await reviewService.verify(
				createdReview.id,
				reviewResource.userId,
				reviewResource.companyId
			);
			chai.expect(verifiedReview.verifiedOn).to.not.be.null.and.be.a('date');
			chai.expect(verifiedReview.status).to.equal('APPROVED');
		});
		it('should fail to verify the same review', async function () {
			try {
				await reviewService.verify(createdReview.id, reviewResource.userId, reviewResource.companyId);
			} catch (e) {
				chai.expect(e.err).to.equal('FORBIDDEN');
				chai.expect(e.msg).to.equal('Review has already been verified');
			}
		});
	});

	describe('Get Various Reviews', function () {
		before(function () {
			if (!!!createdReview) this.skip();
		});
		let publishedCount = 0;
		it('should get a review by id', async function () {
			const review: ComprehensiveReviewDetails = await reviewService.getById(createdReview.id);
			chai.expect(review.id).to.equal(createdReview.id);
		});
		it('should get all reviews for a given user', async function () {
			const userReviews: ComprehensiveReviewDetails[] = await reviewService.getForUser(reviewResource.userId);
			chai.expect(userReviews).to.exist.and.be.an('array');
			userReviews.forEach((review) => {
				chai.expect(review.guest.id).to.equal(reviewResource.userId);
			});
		});
		it('should get all published reviews for a given destination', async function () {
			const destinationReviews: Api.Review.Res.ForDestination = await reviewService.getForDestination(
				createdReview.destination.id
			);
			chai.expect(destinationReviews).to.haveOwnProperty('name');
			chai.expect(destinationReviews).to.haveOwnProperty('description');
			chai.expect(destinationReviews).to.haveOwnProperty('code');
			chai.expect(destinationReviews).to.haveOwnProperty('status');
			chai.expect(destinationReviews).to.haveOwnProperty('logoUrl');
			chai.expect(destinationReviews).to.haveOwnProperty('heroUrl');
			chai.expect(destinationReviews).to.haveOwnProperty('reviewRating');
			chai.expect(destinationReviews).to.haveOwnProperty('reviewCount');
			chai.expect(destinationReviews.reviews).to.exist.and.be.an('array');
			destinationReviews.reviews.forEach((review) => {
				chai.expect(review).to.haveOwnProperty('id');
				chai.expect(review).to.haveOwnProperty('guest');
				chai.expect(review).to.haveOwnProperty('accommodation');
				chai.expect(review).to.haveOwnProperty('packages');
				chai.expect(review).to.haveOwnProperty('message');
				chai.expect(review).to.haveOwnProperty('rating');
				chai.expect(review).to.haveOwnProperty('createdOn');
				chai.expect(review).to.haveOwnProperty('modifiedOn');
				chai.expect(review).to.haveOwnProperty('verifiedOn');
				chai.expect(review).to.haveOwnProperty('status').and.equal('APPROVED');
				chai.expect(review).to.haveOwnProperty('stayStartDate');
				chai.expect(review).to.haveOwnProperty('stayEndDate');
			});
		});
	});

	describe('Delete', function () {
		before(function () {
			if (!!!createdReview) this.skip();
		});
		it('should delete a review', async function () {
			const deletedId: number = await reviewService.delete(createdReview.id);
			chai.expect(deletedId).to.equal(createdReview.id);
			const destinationReviews: Api.Review.Res.ForDestination = await reviewService.getAllForDestination(
				createdReview.destination.id
			);
			destinationReviews.reviews.forEach((review) => {
				chai.expect(review.id).to.not.equal(deletedId);
			});
		});
	});
});
