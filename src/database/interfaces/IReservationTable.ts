import ITable from '../ITable';

export interface ReservationToSave
	extends Omit<
		Model.Reservation,
		| 'id'
		| 'createdOn'
		| 'modifiedOn'
		| 'canceledOn'
		| 'priceDetail'
		| 'reservationNumber'
		| 'externalReservationNumber'
		| 'cancelNumber'
		| 'externalCancelNumber'
		| 'infantCount'
		| 'nightCount'
		| 'confirmationCode'
		| 'completedOn'
	> {
	priceDetail: Api.Reservation.PriceDetail;
	upsellPackages: ReservationUpsellPackageToSave[];
}

export interface ReservationUpsellPackageToSave {
	upsellPackageId: number;
	priceDetail: Api.UpsellPackage.Res.PriceDetail;
}

export interface ReservationToUpdate
	extends Partial<
		Omit<
			ReservationToSave,
			'externalReservationId' | 'externalConfirmationId' | 'itineraryId' | 'companyId' | 'userId'
		>
	> {}

export default interface IReservationTable extends ITable {
	getItinerariesByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	) => Promise<RedSky.RsPagedResponseData<Api.Reservation.Res.Itinerary.Get[]>>;
	delete: null;
	deleteMany: null;
	create: (reservation: ReservationToSave) => Promise<Api.Reservation.Res.Get>;
	update: (id: number, reservation: ReservationToUpdate) => Promise<Api.Reservation.Res.Get>;
	updatePaymentMethod: (reservationId: number, userPaymentMethodId: number) => Promise<Api.Reservation.Res.Get>;
	getById: (reservationId: number, companyId?: number) => Promise<Api.Reservation.Res.Get>;
	getModelById: (reservationId: number) => Promise<Model.Reservation>;
	completeReservation: (confirmationCode: string) => Promise<Model.Reservation>;
	getItinerary: (itineraryNumber: string) => Promise<Api.Reservation.Res.Itinerary.Get>;
	getItineraryByReservationId: (reservationId: number) => Promise<Api.Reservation.Res.Itinerary.Get>;
	getReservationBlock: (destinationId: number, startDate: Date, daysInBlock: number) => Promise<Model.Reservation[]>;
	getUpcomingReservations: (details: Api.Reservation.Req.Upcoming) => Promise<any>;
	cancel: (reservationId: number, externalCancelNumber: string) => Promise<number>;
}
