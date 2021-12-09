import ITable from '../ITable';

export interface Create extends Api.Review.Req.Create {
	userId: number;
	status: Model.ReviewStatus;
}

export interface Update extends Api.Review.Req.Update {
	status?: Model.ReviewStatus;
	verifyUserId?: number;
	verifiedOn?: Date | string;
}

export interface ComprehensiveReviewDetails extends Api.Review.Details {}

export default interface IReviewTable extends ITable {
	getForDestination: (
		destinationId: number,
		status?: Model.ReviewStatus | 'ALL'
	) => Promise<Api.Review.Res.ForDestination>;
	getByDestinationId: (
		destinationId: number,
		status?: Model.ReviewStatus | 'ALL'
	) => Promise<ComprehensiveReviewDetails[]>;
	getByReservation: (reservationId: number) => Promise<Api.Review.Res.Get>;
	getForUser: (userId: number) => Promise<ComprehensiveReviewDetails[]>;
	getComprehensiveReviewById: (createdReviewId: number) => Promise<ComprehensiveReviewDetails>;
}
