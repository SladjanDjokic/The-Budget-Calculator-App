import { boundMethod } from 'autobind-decorator';
import IReservationTable, { ReservationToSave, ReservationToUpdate } from '../interfaces/IReservationTable';
import { UpcomingReservation } from '../objects/reservation.db';
import AccommodationTableMock from './accommodation.db.mock';
import DestinationTableMock from './destination.db.mock';
import UserAddressTableMock from './userAddress.db.mock';
import UserPaymentMethodTableMock from './userPaymentMethod.db.mock';
import TableMock from './table.db.mock';
import UpsellPackageTableMock from './upsellPackage.db.mock';
import { ObjectUtils } from '../../utils/utils';
import reservationResource from '../../test/resources/reservation.service.resource';

export default class ReservationTableMock extends TableMock implements IReservationTable {
	columns: string[];
	lastCreatedId: number = 0;
	lastRequest: any;
	constructor(
		public readonly reservations: { [id: number]: Model.Reservation } = {},
		private readonly destinationTable: DestinationTableMock,
		private readonly accommodationTable: AccommodationTableMock,
		private readonly paymentMethodTable: UserPaymentMethodTableMock,
		private readonly addressTable: UserAddressTableMock,
		private readonly upsellPackageTable: UpsellPackageTableMock
	) {
		super();
		const ids = Object.keys(reservations).map(Number);
		if (!!ids.length) {
			this.lastCreatedId = Math.max(...ids);
		}
	}
	getItinerary(itineraryNumber: string): Promise<Api.Reservation.Res.Itinerary.Get> {
		throw new Error('Method not implemented.');
	}
	async getItineraryByReservationId(reservationId: number): Promise<Api.Reservation.Res.Itinerary.Get> {
		const itineraryId = this.reservations[reservationId].itineraryId;
		const matching = Object.values(this.reservations).filter((res) => res.itineraryId === itineraryId);
		const userId = matching[matching.length - 1].userId;
		const base = matching[0];
		const paymentMethod = await this.paymentMethodTable.getById(base.userPaymentMethodId);
		const billingAddress = await this.addressTable.getById(paymentMethod.userAddressId);
		const destination = await this.destinationTable.getDestinationDetails(base.destinationId);
		const stays = await Promise.all(matching.map(this.mapStay));
		return {
			itineraryId,
			paymentMethod,
			userId,
			parentReservationId: base.parentReservationId || base.id,
			destination,
			billingAddress,
			stays
		};
	}

	getItinerariesByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	): Promise<RedSky.RsPagedResponseData<Api.Reservation.Res.Itinerary.Get[]>> {
		throw new Error('Method not implemented.');
	}

	async completeReservation(reservationCode: string): Promise<Model.Reservation> {
		return Object.values(this.reservations).find(
			(reservation) => reservation.externalConfirmationId === reservationCode
		);
	}

	async create(reservation: ReservationToSave) {
		this.lastRequest = reservation;
		const newReservation: Model.Reservation = {
			...reservation,
			id: ++this.lastCreatedId,
			createdOn: new Date(),
			modifiedOn: new Date(),
			canceledOn: null,
			priceDetail: JSON.stringify(reservation.priceDetail),
			infantCount: 0,
			nightCount: 1,
			completedOn: null
		};
		this.reservations[this.lastCreatedId] = newReservation;
		reservation.upsellPackages.forEach(async (p) => {
			this.linkReservationPackage(this.lastCreatedId, p.upsellPackageId);
		});
		return this.getById(this.lastCreatedId);
	}
	private linkReservationPackage(reservationId: number, upsellPackageId: number): void {
		this.upsellPackageTable.reservationUpsellPackages.push({
			reservationId,
			upsellPackageId,
			priceDetail: JSON.stringify({ total: 100 })
		});
	}
	private unlinkReservationPackages(reservationId: number): void {
		ObjectUtils.pruneInPlace(
			this.upsellPackageTable.reservationUpsellPackages,
			(p) => p.reservationId === reservationId
		);
	}
	async getById(objId: number, companyId?: number): Promise<Api.Reservation.Res.Get> {
		const baseReservation = this.reservations[objId];
		const destination = await this.destinationTable.getDestinationDetails(baseReservation.destinationId);
		const paymentMethod = await this.paymentMethodTable.getById(baseReservation.userPaymentMethodId);
		const billingAddress = await this.addressTable.getById(paymentMethod.userAddressId);
		const accommodation = await this.accommodationTable.getById(baseReservation.accommodationId, companyId);
		return {
			...baseReservation,
			externalReservationId: '123',
			externalConfirmationId: '456',
			itineraryId: '123',
			destination,
			billingAddress,
			paymentMethod,
			accommodation,
			nightCount: 1,
			priceDetail: JSON.parse(baseReservation.priceDetail),
			guest: {
				firstName: baseReservation.guestFirstName,
				lastName: baseReservation.guestLastName,
				phone: baseReservation.guestPhone,
				email: baseReservation.guestEmail
			},
			upsellPackages: (await this.upsellPackageTable.getManyByReservationId(objId)).map((p) => {
				return {
					...p,
					priceDetail: JSON.parse(
						this.upsellPackageTable.reservationUpsellPackages.find(
							(rup) => rup.upsellPackageId === p.id && rup.reservationId === objId
						)?.priceDetail
					)
				};
			})
		};
	}
	getManyByIds: (objIds: readonly number[], companyId?: number) => Promise<any>;
	async getModelById(objId: number): Promise<Model.Reservation> {
		return this.reservations[objId];
	}
	async update(reservationId: number, { upsellPackages, ...updatedReservation }: ReservationToUpdate): Promise<any> {
		const reservation = this.reservations[reservationId];
		for (let field in reservation) {
			if (!!updatedReservation[field]) {
				if (field === 'priceDetail') reservation.priceDetail = JSON.stringify(updatedReservation.priceDetail);
				else reservation[field] = updatedReservation[field];
			}
		}
		reservation.modifiedOn = new Date();
		if (!!upsellPackages) {
			this.unlinkReservationPackages(reservationId);
			upsellPackages.forEach(async (item) => this.linkReservationPackage(reservationId, item.upsellPackageId));
		}
		return this.getById(reservationId);
	}

	async updatePaymentMethod(reservationId: number, paymentMethodId: number): Promise<any> {
		this.reservations[reservationId].userPaymentMethodId = paymentMethodId;
		return this.reservations[reservationId];
	}

	updateMany: (ids: number[], tableObj: any) => Promise<any>;

	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	) => Promise<any>;
	getUpcomingReservations: (details: UpcomingReservation) => Promise<any>;
	delete: null;
	deleteMany: null;

	async getReservationBlock(): Promise<Model.Reservation[]> {
		throw new Error('Method not implemented.');
	}

	async cancel(reservationId: number, externalCancellationId: string): Promise<number> {
		this.reservations[reservationId].externalCancellationId = externalCancellationId;
		return reservationId;
	}

	@boundMethod
	private async mapStay(res: Model.Reservation): Promise<Api.Reservation.Res.Itinerary.Stay> {
		return {
			...res,
			reservationId: res.id,
			accommodation: await this.accommodationTable.getById(res.accommodationId),
			priceDetail: JSON.parse(res.priceDetail),
			review: null,
			guest: {
				firstName: res.guestFirstName,
				lastName: res.guestLastName,
				phone: res.guestPhone,
				email: res.guestEmail
			},
			upsellPackages: (await this.upsellPackageTable.getManyByReservationId(res.id)).map((p) => {
				return {
					...p,
					priceDetail: JSON.parse(
						this.upsellPackageTable.reservationUpsellPackages.find(
							(rup) => rup.upsellPackageId === p.id && rup.reservationId === res.id
						)?.priceDetail
					)
				};
			})
		};
	}
}
