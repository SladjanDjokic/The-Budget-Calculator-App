import TableMock from './table.db.mock';
import IReviewTable, { ComprehensiveReviewDetails, Create, Update } from '../interfaces/IReviewTable';
import { DateUtils } from '../../utils/utils';

export default class ReviewTableMock extends TableMock implements IReviewTable {
	reviews: { [key: number]: ComprehensiveReviewDetails } = {};
	lastId: number = 0;

	constructor(prefillData?: { [key: number]: ComprehensiveReviewDetails }) {
		super();
		if (prefillData) this.reviews = prefillData;
	}

	async getById(reviewId: number): Promise<ComprehensiveReviewDetails> {
		return this.reviews[reviewId];
	}

	async getByReservation(reservationId: number): Promise<Api.Review.Res.Get> {
		return Object.values(this.reviews).find((review) => review.reservationId === reservationId);
	}

	async create(obj: Create): Promise<ComprehensiveReviewDetails> {
		const newId = ++this.lastId;
		this.reviews[newId] = {
			id: newId,
			destination: { id: 1, name: 'test' },
			accommodation: { id: 1, name: 'test' },
			packages: [{ id: 1, name: 'test' }],
			guest: {
				id: 1,
				firstName: 'test',
				lastName: 'user',
				primaryEmail: 'test@user.com',
				accountNumber: '123Test123',
				phone: ''
			},
			...obj,
			verifiedOn: null,
			status: 'PENDING',
			createdOn: DateUtils.dbNow(),
			modifiedOn: null,
			stayStartDate: null,
			stayEndDate: null
		};
		return this.reviews[newId];
	}

	async update(reviewId: number, updateDetails: Update): Promise<ComprehensiveReviewDetails> {
		this.reviews[reviewId] = { ...this.reviews[reviewId], ...updateDetails };
		return this.reviews[reviewId];
	}

	async getForDestination(
		destinationId: number,
		status: Model.ReviewStatus | 'ALL' = 'APPROVED'
	): Promise<Api.Review.Res.ForDestination> {
		const reviews = [];
		for (let i in this.reviews) {
			if (this.reviews[i].destination.id !== destinationId) continue;
			if (status !== 'ALL' && this.reviews[i].status !== status) continue;
			reviews.push(this.reviews[i]);
		}
		return {
			name: 'Test',
			description: 'test description',
			code: 'TESTCODE',
			status: 'PUBLISHED',
			logoUrl: '',
			heroUrl: '',
			reviewRating: 4.2,
			reviewCount: 10,
			reviews
		};
	}

	async getByDestinationId(
		destinationId: number,
		status: Model.ReviewStatus | 'ALL' = 'APPROVED'
	): Promise<ComprehensiveReviewDetails[]> {
		const result = [];
		for (let i in this.reviews) {
			if (this.reviews[i].destination.id !== destinationId) continue;
			if (status !== 'ALL' && this.reviews[i].status !== status) continue;
			result.push(this.reviews[i]);
		}
		return result;
	}

	async getForUser(userId: number): Promise<ComprehensiveReviewDetails[]> {
		const result = [];
		for (let i in this.reviews) {
			if (this.reviews[i].guest.id !== userId) continue;
			result.push(this.reviews[i]);
		}
		return result;
	}

	async verify(reviewId: number, verifiedByUserId: number): Promise<ComprehensiveReviewDetails> {
		this.reviews[reviewId] = {
			...this.reviews[reviewId],
			verifiedOn: DateUtils.dbNow(),
			status: 'APPROVED'
		};
		return this.reviews[reviewId];
	}

	async delete(reviewId: number): Promise<number> {
		delete this.reviews[reviewId];
		return reviewId;
	}

	async getComprehensiveReviewById(createdReviewId: number): Promise<ComprehensiveReviewDetails> {
		return {
			...this.reviews[createdReviewId],
			destination: { id: 1, name: 'test' },
			guest: {
				id: 1,
				firstName: 'Test',
				lastName: 'User',
				primaryEmail: 'test@user.com',
				accountNumber: '123Test123',
				phone: ''
			},
			accommodation: { id: 1, name: 'testAccommodation' }
		};
	}
}
