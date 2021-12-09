export namespace IReservationSystem {
	export interface ServiceDetails {
		username: string;
		password: string;
		baseUrl: string;
		apiVersion: string;
	}

	export interface RefreshKeySet {
		[timestamp: number]: string;
	}

	export interface Destination {
		id: number;
		externalId: string;
		code: string;
		chainId: number;
	}
	export interface Stay {
		arrivalDate: Date | string;
		departureDate: Date | string;
		numberOfAccommodations: number;
		accommodationExternalId: string;
		rateCode: string;
		upsellPackages?: Array<{
			id: number;
			code: string;
			date?: string | Date;
			time?: string | Date;
		}>;
	}
	export interface GuestCounts {
		adultCount: number;
		childCount: number;
	}
	type Address = Omit<Model.UserAddress, 'modifiedOn' | 'createdOn' | 'id' | 'type' | 'userId' | 'isDefault'>;
	export interface Guest {
		givenName: string;
		middleName: string;
		surname: string;
		namePrefix: string;
		nameSuffix: string;
		address: Address;
		emailAddress: string;
		phoneNumber: string;
	}
	export interface Payment {
		amountInCents: number;
		cardHolder: string;
		token: string;
		expirationMonth: string;
		expirationYearLastTwo: string;
	}
	export interface Rate extends Omit<Model.Rate, 'id'> {}
	export interface VerifyAvailabilityRequest
		extends Omit<Api.Reservation.Req.Verification, 'destinationId' | 'accommodationId' | 'numberOfAccommodations'> {
		companyDetails: RedSky.IntegrationCompanyDetails;
		destination: {
			id: number;
			externalId: string;
			chainId: number;
		};
		accommodation: {
			id: number;
			externalId: string;
			quantity: number;
		};
		existingConfirmationId?: string;
	}

	export namespace CreateReservation {
		export interface Req {
			companyDetails: RedSky.IntegrationCompanyDetails;
			itineraryId?: string;
			destination: IReservationSystem.Destination;
			stay: IReservationSystem.Stay;
			guestCounts: IReservationSystem.GuestCounts;
			primaryGuest: IReservationSystem.Guest;
			payment: IReservationSystem.Payment;
			additionalDetails?: string;
		}

		export interface Res {
			id: string;
			confirmationId: string;
			itineraryNumber: string;
			cancellationPermitted: boolean;
			priceDetail: Api.Reservation.PriceDetail;
			metaData: any;
		}
	}

	export namespace UpdateReservation {
		export interface Req extends Partial<CreateReservation.Req> {
			companyDetails: RedSky.IntegrationCompanyDetails;
			itineraryId: string;
			externalReservationId: string;
			externalConfirmationId: string;
			destination: IReservationSystem.Destination;
		}
		export interface Res extends CreateReservation.Res {}
	}

	export namespace CancelReservation {
		export interface Req {
			companyDetails: RedSky.IntegrationCompanyDetails;
			reservationId: string;
			reservationConfirmationId: string;
			destination: {
				externalId: string;
			};
		}

		export interface Res {
			cancellationId: string;
		}
	}

	export namespace GetReservation {
		export interface Req {
			companyDetails: RedSky.IntegrationCompanyDetails;
			reservationConfirmationId: string;
			destinationId: number;
			guest?: Api.Reservation.Guest;
		}
		export interface Res extends Api.Reservation.Res.Verification {
			reservationId: string;
			confirmationId: string;
			itineraryId: string;
			cancellationPermitted: boolean;
			cancellationId?: string;
			guest: {
				firstName: string;
				lastName: string;
				email: string;
				phone: string;
			};
			numberOfAccommodations: number;
			additionalDetails: string;
			metadata: any;
		}
	}
}
