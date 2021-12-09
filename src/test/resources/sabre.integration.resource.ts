import { DateUtils } from '../../utils/utils';
import { ISabre } from '../../integrations/sabre/Sabre.interface';
import { ExternalToLocalDestinationIdMap } from '../../integrations/destinationSystem/destinationSystem';
import { IReservationSystem } from '../../integrations/reservationSystem/reservationSystem.interface';

const companyId = 1;
const hotelId = 9950;
const hotelCode = 'MCOENC';
const chainId = 26048;
const invalidHotelId = Date.now().toString();
const destinationId = 3;
const indexDate = '2021-01-07';
const upsellPackageId = 247;
const reservationLeadTimeInDays: number = 60;
const nightsOfStay: number = 4;

const availabilityOptions: ISabre.Destination.Req.AccommodationSearch = {
	hotelId,
	chainId,
	startDate: `${new Date().getFullYear()}-${DateUtils.padStart(
		new Date().getMonth().toString()
	)}-${DateUtils.padStart(new Date().getDate().toString())}`,
	endDate: `${new Date().getFullYear()}-${DateUtils.padStart(new Date().getMonth().toString())}-${DateUtils.padStart(
		(new Date().getDate() + 2).toString()
	)}`,
	adults: 1,
	numRooms: 1,
	primaryChannel: 'WEB',
	secondaryChannel: 'SYNXIS_VA'
};

const rate: Model.Rate = {
	id: 1,
	code: 'TEST',
	name: 'Test Rate',
	description:
		'The rate. The rate for the test, the rate created especially to pass the test, the test rate. That rate.',
	destinationId
};

const sabrePricesObj: ISabre.Model.ProductAvailable = {
	Product: {
		Prices: {
			Daily: [
				{
					Price: {
						Fees: {
							Amount: 0.0
						},
						Tax: {
							Amount: 0.0
						},
						Total: {
							Amount: 65.0,
							AmountWithTaxesFees: 65.0,
							AmountWithInclusiveTaxes: 65.0
						},
						Amount: 65.0,
						CurrencyCode: 'EUR'
					},
					Date: '2021-01-07T00:00:00',
					AvailableInventory: 6
				},
				{
					Price: {
						Fees: {
							Amount: 0.0
						},
						Tax: {
							Amount: 0.0
						},
						Total: {
							Amount: 62.0,
							AmountWithTaxesFees: 62.0,
							AmountWithInclusiveTaxes: 62.0
						},
						Amount: 62.0,
						CurrencyCode: 'EUR'
					},
					Date: '2021-01-08T00:00:00',
					AvailableInventory: 6
				},
				{
					Price: {
						Fees: {
							Amount: 0.0
						},
						Tax: {
							Amount: 0.0
						},
						Total: {
							Amount: 65.0,
							AmountWithTaxesFees: 65.0,
							AmountWithInclusiveTaxes: 65.0
						},
						Amount: 65.0,
						CurrencyCode: 'EUR'
					},
					Date: '2021-01-09T00:00:00',
					AvailableInventory: 6
				}
			],
			PerNight: {
				Price: {
					Fees: {
						Amount: 0.0
					},
					Tax: {
						Amount: 0.0
					},
					Total: {
						Amount: 66.25,
						AmountWithTaxesFees: 66.25
					},
					Amount: 66.25,
					CurrencyCode: 'EUR'
				}
			},
			Total: {
				Price: {
					Fees: {
						BreakDown: [],
						Amount: 0.0
					},
					Tax: {
						BreakDown: [],
						Amount: 0.0
					},
					Total: {
						Amount: 1590.0,
						AmountWithTaxesFees: 1590.0,
						AmountWithInclusiveTaxes: 1590.0
					},
					Amount: 1590.0,
					CurrencyCode: 'EUR'
				}
			},
			TaxesFeesIncluded: true
		},
		Rate: {
			Code: rate.code
		},
		Room: {
			Code: 'A1Q'
		},
		StayLimits: {
			MinimumStay: 1,
			MaximumStay: 10
		}
	},
	Available: true,
	AvailableInventory: 3,
	IsMaximumPricedItem: false,
	IsMinimumPricedItem: true,
	SortSequenceNumber: 1
};

const verifyAvailabilityRequest: IReservationSystem.VerifyAvailabilityRequest = {
	destination: {
		id: destinationId,
		externalId: hotelId.toString(),
		chainId: chainId
	},
	accommodation: {
		id: 0,
		externalId: '',
		quantity: 1
	},
	adultCount: 2,
	childCount: 0,
	arrivalDate: DateUtils.addDays(new Date(), reservationLeadTimeInDays),
	departureDate: DateUtils.addDays(new Date(), reservationLeadTimeInDays + nightsOfStay),
	companyDetails: null,
	upsellPackages: [{ id: upsellPackageId }]
};

const createReservationRequest: IReservationSystem.CreateReservation.Req = {
	destination: {
		id: destinationId,
		externalId: hotelId.toString(),
		code: hotelCode,
		chainId
	},
	stay: {
		arrivalDate: new Date(verifyAvailabilityRequest.arrivalDate),
		departureDate: new Date(verifyAvailabilityRequest.departureDate),
		numberOfAccommodations: verifyAvailabilityRequest.accommodation.quantity,
		accommodationExternalId: verifyAvailabilityRequest.accommodation.externalId,
		rateCode: '',
		upsellPackages: []
	},
	guestCounts: {
		adultCount: verifyAvailabilityRequest.adultCount,
		childCount: verifyAvailabilityRequest.childCount
	},
	primaryGuest: {
		givenName: 'Tester',
		middleName: 'T',
		surname: 'Testingberry',
		namePrefix: '',
		nameSuffix: '',
		phoneNumber: '8886665555',
		emailAddress: 'testingberry@example.com',
		address: {
			address1: '100 Proving Street',
			address2: '',
			city: 'Testville',
			state: 'UT',
			zip: '84660',
			country: 'US',
			name: 'Home'
		}
	},
	payment: {
		amountInCents: 100,
		cardHolder: 'Tester Testingberry',
		token: 'testpaymenttoken',
		expirationMonth: '06',
		expirationYearLastTwo: ((new Date().getFullYear() + 5) % 100).toString()
	},
	additionalDetails: 'Additional testing information ' + new Date().getTime().toString(),
	companyDetails: null
};

const updateReservationRequest: IReservationSystem.UpdateReservation.Req = {
	companyDetails: null,
	destination: createReservationRequest.destination,
	itineraryId: null,
	externalConfirmationId: null,
	externalReservationId: null
};

const updatedGuest = {
	givenName: 'Different',
	middleName: 'D',
	surname: 'Differential',
	namePrefix: '',
	nameSuffix: '',
	phoneNumber: '8886665555',
	emailAddress: 'diff@example.com',
	address: {
		address1: '100 Proving Street',
		address2: '',
		city: 'Testville',
		state: 'UT',
		zip: '84660',
		country: 'US',
		name: 'Home'
	}
};

const updatedGuestCounts: IReservationSystem.GuestCounts = {
	adultCount: createReservationRequest.guestCounts.adultCount + 1,
	childCount: 2
};

const updatedStay = {
	...createReservationRequest.stay,
	checkInDate: DateUtils.addDays(createReservationRequest.stay.arrivalDate, 2),
	checkOutDate: DateUtils.addDays(createReservationRequest.stay.departureDate, 2)
};

const cancelReservationRequest: IReservationSystem.CancelReservation.Req = {
	companyDetails: null,
	reservationId: '',
	reservationConfirmationId: '',
	destination: {
		externalId: hotelId.toString()
	}
};

const destinationForPackages: ExternalToLocalDestinationIdMap = {
	[hotelId.toString()]: destinationId
};

const sabreResource = {
	companyId,
	hotelId,
	chainId,
	invalidHotelId,
	destinationId,
	availabilityOptions,
	sabrePricesObj,
	rate,
	indexDate,
	upsellPackageId,
	verifyAvailabilityRequest,
	createReservationRequest,
	cancelReservationRequest,
	destinationForPackages,
	updateReservationRequest,
	updatedGuest,
	updatedGuestCounts,
	updatedStay,
	nightsOfStay
};

export default sabreResource;
