declare namespace Api {
	export interface MediaDetails {
		id: number;
		isPrimary: 0 | 1;
	}

	export interface AvailabilityFilter {
		startDate: Date | string;
		endDate: Date | string;
		adultCount: number;
		childCount: number;
		priceRangeMin?: number;
		priceRangeMax?: number;
		propertyTypeIds?: number[];
		experienceIds?: number[];
		amenityIds?: number[];
		bedroomCount?: number;
		bathroomCount?: number;
		sortOrder: 'ASC' | 'DESC';
		pagination: RedSky.PagePagination;
	}

	export interface Media extends Omit<Model.Media, 'storageDetails'> {}

	export namespace Accommodation {
		export namespace Req {
			export interface Details {
				accommodationId: number;
			}

			export interface Update {
				id: number;
				name?: string;
				shortDescription?: string;
				longDescription?: string;
				propertyTypeId?: number;
				bedroomCount?: number;
				bathroomCount?: number;
				address1?: string;
				address2?: string;
				city?: string;
				state?: string;
				zip?: string;
				country?: string;
				status?: Model.AccommodationStatusType;
				heroUrl?: string;
				mediaIds?: MediaDetails[];
				amenityIds?: number[];
			}

			export interface GetByPage {
				pagination: string;
				sort: string;
				filter: string;
			}

			export interface Availability extends AvailabilityFilter {
				destinationId: number;
			}
		}
		export namespace Res {
			export interface Update extends Details {}

			export interface Details extends Model.Accommodation {
				logoUrl: string;
				accommodationType: Model.AccommodationTypes;
				accommodationTypeCode: string;
				accommodationTypeDescription: string;
				media: Media[];
				layout: AccommodationLayout.Details[];
				categories: AccommodationCategory.Details[];
				amenities: Model.Amenity[];
			}

			export interface GetByPage {
				data: Details[];
				total: number;
			}

			export interface Availability {
				id: number;
				name: string;
				propertyTypeId: number;
				longDescription: string;
				media: Media[]; //*All media for accommodation and accommodation categories*
				amenities: Model.Amenity[];
				maxSleeps: number;
				maxOccupantCount: number;
				bedroomCount: number;
				bathroomCount: number;
				size: { max: number; min: number; units: string }; //*square footage, if we have it. Let me know what other info we might be able to grab that would be relivant*
				adaCompliant: 0 | 1;
				extraBeds: 0 | 1;
				extraBedPriceCents: number;
				costPerNightCents: number;
				availableAccommodationCount: number;
				pointsPerNight: number;
				pointsEarned: number;
			}
		}
	}

	export namespace AccommodationCategory {
		export interface Details extends Model.AccommodationCategory {
			media: Media[];
			features: Feature.Details[];
		}

		export namespace Req {
			export interface Create {
				accommodationId: number;
				title: string;
				description?: string;
				features?: number[];
				mediaIds?: MediaDetails[];
			}

			export interface Get {
				id?: number;
				ids?: number[];
			}

			export interface Update {
				id: number;
				title?: string;
				description?: string;
				features?: Feature.Req.Create[];
				mediaIds?: MediaDetails[];
			}

			export interface GetByAccommodation {
				accommodationId: number;
			}

			export interface GetByDestination {
				destinationId: number;
			}

			export interface Delete {
				id: number;
			}
		}
		export namespace Res {
			export interface Create extends Details {}

			export interface Get extends Details {}

			export interface Update extends Details {}
		}
	}

	export namespace AccommodationLayout {
		export interface Details extends Model.AccommodationLayout {
			rooms: Model.AccommodationLayoutRoom[];
			media: Media;
		}

		export namespace Req {
			export interface Create {
				accommodationId: number;
				title: string;
				mediaId: number;
			}

			export interface Update {
				id: number;
				title?: string;
				mediaId: number;
			}

			export interface Delete {
				id: number;
			}

			export interface Get {
				id?: number;
				ids?: number[];
			}

			export interface GetByPage {
				pagination: string;
				sort: string;
				filter: string;
			}
		}
		export namespace Res {
			export interface Create extends Details {}

			export interface Update extends Details {}

			export interface Get extends Details {}

			export interface GetByPage {
				data: Details[];
				total: number;
			}
		}
	}

	export namespace AccommodationLayoutRoom {
		export namespace Req {
			export interface Create {
				accommodationLayoutId: number;
				title: string;
				description: string;
			}

			export interface Update {
				id: number;
				title?: string;
				description?: string;
			}

			export interface Delete {
				id: number;
			}

			export interface Get {
				id?: number;
				ids?: number[];
			}

			export interface GetForLayout {
				accommodationLayoutId: number;
			}
		}
		export namespace Res {
			export interface Create extends Model.AccommodationLayoutRoom {}

			export interface Update extends Model.AccommodationLayoutRoom {}

			export interface Get extends Model.AccommodationLayoutRoom {}

			export interface GetForLayout extends Model.AccommodationLayoutRoom {}
		}
	}

	export namespace Action {
		export namespace Req {
			export interface Create {
				name: string;
				description?: string;
				isActive?: 0 | 1;
				brandId?: number;
				brandLocationId?: number;
				type: string;
				pointValue: number;
			}

			export interface Get {
				id?: number;
				ids?: number[];
			}

			export interface Update {
				id: number;
				name?: string;
				description?: string;
				isActive?: 0 | 1;
				brandId?: number;
				brandLocationId?: number;
				type?: string;
				pointValue?: number;
			}

			export interface Delete {
				id: number;
			}

			export interface Fulfill {
				actionId: number;
			}
		}

		export namespace Res {
			export interface Get extends Omit<Model.Action, 'companyId' | 'brandId' | 'brandLocationId'> {
				brand: Model.Brand;
				brandLocation: Model.BrandLocation;
			}

			export interface Details extends Get {
				campaigns: CampaignDetails[];
			}

			export interface CampaignDetails extends Omit<Model.Campaign, 'companyId'> {
				campaignActionId: number;
				actionCount: number;
			}
		}
	}

	export namespace Amenity {
		export namespace Req {
			export interface Create extends Omit<Model.Amenity, 'id'> {}

			export interface Update extends Partial<Create> {
				id: number;
			}

			export interface Delete {
				id: number;
			}
		}

		export namespace Res {
			export interface Create extends Model.Amenity {}

			export interface Update extends Create {}

			export interface Get extends Create {}

			export interface Delete {
				id: number;
			}
		}
	}

	export namespace Brand {
		export namespace Req {
			export interface Get {
				id: number;
			}

			export interface Report {
				id?: number;
				pageQuery: RedSky.PageQuery;
			}

			export interface Update extends Partial<Omit<Model.Brand, 'createdOn' | 'externalId' | 'modifiedOn'>> {
				id: number;
			}

			export namespace Location {
				export interface Get {
					id: number;
				}
				export interface Update extends Partial<Omit<Model.BrandLocation, 'brandId' | 'externalId'>> {
					id: number;
				}
				export interface Report {
					id: number;
					pageQuery: RedSky.PageQuery;
				}
			}
		}
		export namespace Res {
			export interface BrandLocation
				extends Pick<Model.BrandLocation, 'id' | 'name' | 'loyaltyStatus' | 'city' | 'state'> {}
			export interface Get extends Model.Brand {}
			export interface Details extends Get {
				companyName: string;
				locations: BrandLocation[];
				pointsPerDollar: number;
				costPerPoint: number;
			}

			export interface Report {
				brandName: string;
				spireYTDRevenue: number;
				pointsPerDollar: number;
				costPerPoint: number;
				costToMerchant: number;
				spireRevenuePerDollar: number;
				spireRevenuePerPoint: number;
				loyaltyStatus: Model.LoyaltyStatus;
			}
			export interface Location extends Model.BrandLocation {}
			export namespace Location {
				export interface Get extends Model.BrandLocation {}
				export interface Details extends Model.BrandLocation {
					pointsPerDollar: number;
					costPerPoint: number;
					spireYTDRevenue: number;
				}
				export interface Transaction {
					transactionDate: string | Date;
					transactionId: string;
					cardType: string;
					last4: number;
					pointsTransacted: number;
					totalTransactionAmount: number;
					deferredRevenue: number;
					customerName: string;
					primaryEmail: string;
				}

				export interface Overview {
					id: number;
					locationName: string;
					spireRevenueYTD: number;
				}
			}
		}
	}

	export namespace Campaign {
		export interface Action extends Omit<Model.Action, 'companyId'> {
			campaignActionId: number;
			actionCount: number;
		}

		export interface Detail extends Model.Campaign {
			actions: Action[];
		}

		export namespace Req {
			export interface Create {
				segmentId?: number;
				name: string;
				description?: string;
				isActive?: 0 | 1;
				maxReward: number;
				type: string;
				startOn: Date | string;
				endOn: Date | string;
				pointValueMultiplier: number;
				activityReferenceNumber?: string;
				actions: CampaignAction.CreateMany[];
			}

			export interface Get {
				id?: number;
				ids?: number[];
			}

			export interface Update {
				id: number;
				segmentId?: number;
				name?: string;
				description?: string;
				isActive?: 0 | 1;
				maxReward?: number;
				type?: string;
				startOn?: Date | string;
				endOn?: Date | string;
				pointValueMultiplier?: number;
				activityReferenceNumber?: string;
				actions?: CampaignAction.CreateMany[];
			}

			export interface Delete {
				id: number;
			}

			export interface Consolidate {
				userId?: number;
			}
		}

		export namespace Res {
			export interface Create extends Detail {}

			export interface Get extends Detail {}

			export interface GetByPage {
				data: Detail[];
				total: number;
			}

			export interface Update extends Detail {}
		}
	}

	export namespace CampaignAction {
		export interface Create {
			campaignId: number;
			actionId: number;
			actionCount?: number;
			isActive?: 0 | 1;
		}

		export interface CreateMany {
			actionId: number;
			actionCount?: number;
			isActive?: 0 | 1;
		}
	}

	export namespace Company {
		export namespace Req {
			export interface Create extends Partial<Omit<Model.Company, 'id' | 'createdOn' | 'modifiedOn'>> {
				name: string;
				vanityUrls: string[];
				newAdminEmail: string;
				newAdminPassword: string;
			}

			export interface Details {
				id: number;
			}

			export interface Get {
				id?: number;
				ids?: number[];
			}

			export interface Update extends Partial<Omit<Model.Company, 'createdOn' | 'modifiedOn'>> {
				id: number;
			}

			export interface Delete {
				id?: number;
				ids?: number[];
			}

			export interface UpdateUnauthorizedPages {
				unauthorizedPages: Model.PageGuard[];
			}

			export interface UpdateAvailablePages {
				availablePages: Model.PageGuard[];
			}
		}
		export namespace Res {
			export interface Create extends Model.Company {}

			export interface Update extends Model.Company {}

			export interface Get extends Model.Company {}

			export interface Details extends Get {}

			export interface GetCompanyAndClientVariables
				extends Pick<Model.Company, 'id' | 'name' | 'squareLogoUrl' | 'wideLogoUrl'> {
				allowPointBooking: 0 | 1;
				allowCashBooking: 0 | 1;
				customPages: { [key: string]: any };
				unauthorizedPages: Model.PageGuard[];
			}

			export interface GetAvailablePages extends Model.PageGuard {}
		}
	}

	export namespace Country {
		interface Timezones {
			zoneName: string;
			gmtOffset: number;
			gmtOffsetName: string;
			abbreviation: string;
			tzName: string;
		}

		interface ICountry {
			name: string;
			phonecode: string;
			isoCode: string;
			flag: string;
			currency: string;
			latitude: string;
			longitude: string;
			timezones?: Timezones[];
		}

		interface IState {
			name: string;
			isoCode: string;
			countryCode: string;
			latitude?: string | null;
			longitude?: string | null;
		}

		interface ICity {
			name: string;
			countryCode: string;
			stateCode: string;
			latitude?: string | null;
			longitude?: string | null;
		}

		export namespace Req {
			export interface AllCountries {}

			export interface Country {
				countryCode: string;
			}

			export interface States {
				countryCode: string;
			}

			export interface Cities {
				countryCode: string;
				stateCode: string;
			}
		}
		export namespace Res {
			export interface AllCountries {
				countries: ICountry[];
			}

			export interface Country extends ICountry {}

			export interface States {
				states: IState[];
			}

			export interface Cities {
				cities: ICity[];
			}
		}
	}

	export namespace Destination {
		export namespace Req {
			export interface Get {
				id?: number;
				ids?: number[];
			}

			export interface Update {
				id: number;
				description?: string;
				locationDescription?: string;
				propertyTypeIds?: number[];
				regionIds?: number[];
				status?: string;
				address1?: string;
				address2?: string;
				city?: string;
				state?: string;
				zip?: string;
				country?: string;
				logoUrl?: string;
				heroUrl?: string;
				mediaIds?: MediaDetails[];
				isActive?: 0 | 1;
				loyaltyStatus?: Model.LoyaltyStatus;
			}

			export interface AccommodationType {
				destinationId?: number;
				destinationIds?: number[];
			}

			export interface PropertyType {
				destinationId: number;
			}

			export interface DestinationRegion {
				destinationId: number;
			}

			export interface Features {
				destinationId: number;
			}

			export interface Packages {
				destinationId: number;
			}

			export interface Details {
				destinationId: number;
				// These are required to get a lowest price back
				startDate?: Date | string;
				endDate?: Date | string;
			}

			export interface GetByPage {
				pagination: string;
				sort: string;
				filter: string;
			}

			export interface Availability extends AvailabilityFilter {
				regionIds?: number[];
			}
		}
		export namespace Res {
			export interface Get
				extends Pick<
					Model.Destination,
					| 'id'
					| 'companyId'
					| 'name'
					| 'description'
					| 'code'
					| 'status'
					| 'address1'
					| 'address2'
					| 'city'
					| 'state'
					| 'zip'
					| 'country'
					| 'logoUrl'
					| 'heroUrl'
					| 'loyaltyStatus'
					| 'isActive'
				> {
				media: Media[];
				latitude?: number;
				longitude?: number;
			}

			export interface Update extends Details {}

			export interface PropertyType extends Model.PropertyType {}

			export interface DestinationRegion extends Model.Region {}

			export interface DestinationExperience extends Model.Experience, Model.DestinationExperience {
				media: Media[];
			}

			export interface DetailsAccommodation {
				id: number;
				name: string;
				propertyTypeId: number;
				amenities: Model.Amenity[];
				roomCount: number;
				bedDetails: { [key: string]: string };
				shortDescription: string;
				longDescription: string;
				priceCents: string;
				maxOccupantCount: number;
				maxSquareFt?: number;
				minSquareFt?: number;
			}

			export interface Details
				extends Omit<
					Model.Destination,
					'metaData' | 'externalSystemId' | 'modifiedOn' | 'chainId' | 'latitude' | 'longitude'
				> {
				externalId: string;
				latitude?: number;
				longitude?: number;
				regions: DestinationRegion[];
				minBedroom: number;
				maxBedroom: number;
				minBathroom: number;
				maxBathroom: number;
				lowestPriceInCents?: number;
				propertyTypes: PropertyType[];
				media: Media[];
				experiences: DestinationExperience[];
				packages: UpsellPackage.Details[];
				accommodations: DetailsAccommodation[];
				accommodationTypes: Pick<AccommodationType, 'id' | 'name' | 'description' | 'code'>[];
				policies: { type: Model.DestinationPolicyType; value: string }[];
			}

			export interface Accommodation {
				id: number;
				name: string;
				propertyTypeId: number;
				bedroomCount: number;
				bathroomCount: number;
				bedDetails: any;
				priceCents: number;
				maxOccupantCount: number;
				prices: {
					priceCents: number;
					pricePoints: number;
					quantityAvailable: number;
					rate: Rate;
					minStay: number;
				}[];
				amenities: {
					id: number;
					title: string;
					icon: string;
				}[];
				maxSquareFt?: number;
				minSquareFt?: number;
			}

			export interface Availability {
				id: number;
				name: string;
				description: string;
				code: string;
				status: string;
				address1: string;
				address2: string;
				city: string;
				state: string;
				zip: string;
				country: string;
				minBedroom: number;
				maxBedroom: number;
				minBathroom: number;
				maxBathroom: number;
				propertyTypes: PropertyType[];
				logoUrl: string;
				reviewRating: number;
				reviewCount: number;
				media: Media[];
				minAccommodationPrice: number;
				minAccommodationPoints: number;
				experiences: DestinationExperience[];
				accommodationTypes: {
					id: number;
					name: string;
				}[];
				accommodations: Accommodation[];
			}

			export interface Rate extends Omit<Model.Rate, 'id' | 'destinationId'> {}

			export interface AccommodationType extends Model.AccommodationType {}
		}
	}

	export namespace Experience {
		export namespace Req {
			export interface Create extends Omit<Model.Experience, 'id'> {}

			export interface CreateDestinationExperience {
				destinationId: number;
				experienceId: number;
				description: string;
				isHighlighted: 0 | 1;
				media: Omit<Api.Media, 'urls' | 'companyId' | 'uploaderId' | 'type'>[];
			}

			export interface UpdateDestinationExperience extends CreateDestinationExperience {
				destinationExperienceId: number;
			}

			export interface Update extends Partial<Create> {
				id: number;
			}

			export interface Delete {
				id?: number;
				ids?: number[];
			}
		}

		export namespace Res {
			export interface Create extends Model.Experience {}

			export interface Update extends Create {}

			export interface Get extends Create {}

			export interface Delete {
				id: number;
			}
		}
	}

	export namespace Feature {
		export interface Details extends Model.Feature {
			media: Media[];
		}

		export namespace Req {
			export interface Create {
				brandId?: number;
				destinationId?: number;
				accommodationId?: number;
				accommodationCategoryId?: number;
				title?: string;
				description?: string;
				mediaIds?: MediaDetails[];
				icon?: string;
				isActive: 0 | 1;
				isCarousel: 0 | 1;
			}

			export interface Update {
				id: number;
				title?: string;
				description?: string;
				mediaIds?: MediaDetails[];
				icon?: string;
				isActive?: 0 | 1;
				isCarousel?: 0 | 1;
			}

			export interface Get {
				id?: number;
				ids?: number[];
			}

			export interface Delete {
				id?: number;
				ids?: number[];
			}

			export interface GetByPage {
				pagination: string;
				sort: string;
				filter: string;
			}
		}
		export namespace Res {
			export interface Create extends Details {}

			export interface Update extends Details {}

			export interface Get extends Details {}

			export interface Delete extends Details {}

			export interface GetByPage {
				data: Details[];
				total: number;
			}
		}
	}

	export namespace Media {
		export namespace Req {
			export interface CreateImagePyramid {
				keepTransparency?: boolean;
				file: any;
			}

			export interface Get {
				id?: number;
				ids?: number[];
			}

			export interface Update {
				id: number;
				title?: string;
				description?: string;
				isPrimary?: 0 | 1;
			}

			export interface Delete {
				id?: number;
				ids?: number[];
			}
		}
		export namespace Res {
			export interface Get extends Media {}

			export interface Update extends Media {}

			export interface Delete {}
		}
	}

	export namespace Order {
		export namespace Req {
			interface Get {
				id: number;
			}

			interface User {
				userId: number;
			}

			interface Create {
				rewardId: number;
				voucherId?: number;
				paymentMethodId?: number;
				status: Model.OrderRedemptionStatus;
				type: string;
			}

			interface Update {
				id: number;
				paymentMethodId?: number;
				status: Model.OrderRedemptionStatus;
				priceDetail?: string;
			}

			interface Delete {
				id: number;
			}

			interface PaymentAmount {
				currency: string;
				value: number;
			}

			export interface PaymentMethods {
				countryCode: string;
				shopperLocale: string;
				amount: PaymentAmount;
			}

			interface CreatePaymentMethod {
				type: string;
				encryptedCardNumber: string;
				encryptedSecurityCode: string;
				encryptedExpiryMonth: string;
				encryptedExpiryYear: string;
				holderName?: string;
			}

			export interface CreatePayment {
				referenceId: number;
				amount: PaymentAmount;
				paymentMethod: CreatePaymentMethod;
				storePaymentMethod: boolean;
			}
		}
		export namespace Res {
			interface Get extends Model.Orders {
				name: string;
				pointCost: number;
			}

			interface Create extends Get {}

			interface Update extends Get {}

			interface PaymentMethodDetail {
				key: string;
				type: 'cardToken' | 'text' | 'tel' | 'select' | 'radio' | 'emailAddress';
				optional?: boolean;
			}

			export interface PaymentMethod {
				name: string;
				type: string;
				brands?: 'visa' | 'mc' | 'amex' | 'discover' | 'diners';
				details?: PaymentMethodDetail[];
				fundingSource?: 'credit' | 'debit';
			}

			export interface PaymentMethods {
				paymentMethods: PaymentMethod[];
			}

			export interface CreatePayment {
				integration_info: string;
			}
		}
	}

	export namespace Payment {
		export interface PmData {
			address1: string;
			address2: string;
			callback_url: string;
			card_type: string; // 'visa'
			city: string;
			company: string;
			country: string;
			created_at: Date | string;
			data: any;
			eligible_for_card_updater: boolean;
			email: string;
			errors: any[];
			fingerprint: string;
			first_name: string;
			first_six_digits: number;
			full_name: string;
			last_four_digits: number;
			last_name: string;
			metadata: any;
			month: number;
			number: string;
			payment_method_type: string;
			phone_number: string;
			shipping_address1: string;
			shipping_address2: string;
			shipping_city: string;
			shipping_country: string;
			shipping_phone_number: string;
			shipping_state: string;
			shipping_zip: string;
			state: string;
			storage_state: string;
			test: boolean;
			token: string;
			updated_at: Date | string;
			verification_value: string;
			year: number;
			zip: string;
		}

		export namespace Req {
			export interface Create {
				userId?: number;
				cardToken: string;
				pmData: PmData;
				userAddressId?: number;
				isPrimary?: 0 | 1;
				offsiteLoyaltyEnrollment?: 0 | 1;
			}

			export interface PublicData {}

			export interface ActiveForUser {}

			export interface Delete {
				id: number;
			}

			export interface Update {
				id: number;
				isPrimary: 0 | 1;
			}
		}
		export namespace Res {
			export interface Create extends Model.UserPaymentMethod {}

			export interface PublicData {
				id: number;
				name: string;
				publicData: { token: string };
			}

			export interface ActiveForUser extends Model.UserPaymentMethod {}

			export interface Delete {}

			export interface Update extends Model.UserPaymentMethod {}
		}
	}

	export namespace Region {
		export namespace Req {
			export interface Get {}

			export interface Create extends Omit<Model.Region, 'id' | 'isActive'> {}

			export interface Update extends Partial<Model.Region> {
				id: number;
			}
		}

		export namespace Res {
			export interface Get extends Model.Region {}

			export interface Detail extends Model.Region {}
		}
	}

	export namespace Reservation {
		export interface AccommodationDetails {
			id: number;
			name: string;
			shortDescription: string;
			longDescription: string;
			propertyType: string;
			featureIcons: string[];
			address1: string;
			address2: string;
			city: string;
			state: string;
			zip: string;
			country: string;
			heroUrl: string;
			maxSleeps: number;
			roomCount: number;
			floorCount: number;
			extraBed: 1 | 0;
			adaCompliant: 1 | 0;
			maxOccupantCount: number;
			media: Media[];
		}

		export interface DestinationDetails {
			id: number;
			externalId: string;
			companyId: number;
			name: string;
			description: string;
			status: string;
			address1: string;
			address2: string;
			city: string;
			state: string;
			zip: string;
			country: string;
			logoUrl: string;
			heroUrl: string;
			policies: { type: Model.DestinationPolicyType; value: string }[];
			packages: UpsellPackage.Details[];
			experiences: Destination.Res.DestinationExperience[];
			media: Media[];
		}

		interface PriceDetail {
			accommodationDailyCostsInCents: { [date: string]: number };
			accommodationTotalInCents: number;
			feeTotalsInCents: { name: string; amount: number }[];
			taxTotalsInCents: { name: string; amount: number }[];
			taxAndFeeTotalInCents: number;
			subtotalInCents: number;
			subtotalPoints: number;
			upsellPackageTotalInCents: number;
			upsellPackageTotalPoints: number;
			grandTotalCents: number;
			grandTotalPoints: number;
		}

		export interface PaymentMethod {
			id: number;
			userAddressId: number;
			nameOnCard: string;
			type: string;
			last4: number;
			expirationMonth: number;
			expirationYear: number;
			cardNumber: string;
			isPrimary: 0 | 1;
			createdOn: Date | string;
			systemProvider: string;
		}

		export interface BillingAddressDetails {
			address1: string;
			address2: string;
			city: string;
			state: string;
			zip: string;
			country: string;
		}

		interface Guest {
			firstName: string;
			lastName: string;
			phone: string;
			email: string;
		}

		export namespace Req {
			export interface Availability extends AvailabilityFilter {
				destinationId?: number;
				currencyCode?: string;
				roomClass?: 'adacompliance';
			}

			export interface Verification {
				destinationId: number;
				accommodationId: number;
				numberOfAccommodations: number;
				rateCode?: string;
				arrivalDate: string | Date;
				departureDate: string | Date;
				adultCount: number;
				childCount: number;
				upsellPackages?: UpsellPackage[];
				existingReservationId?: number;
			}

			export interface Create extends Omit<Verification, 'existingReservationId'> {
				rateCode: string;
				paymentMethodId?: number;
				guest: Guest;
				additionalDetails?: string;
			}

			export interface Update extends Partial<Omit<Create, 'destinationId'>> {
				id: number;
			}

			export interface Complete {
				confirmationCode: string;
			}

			export interface UpdatePayment {
				itineraryId: string;
				paymentMethodId: number;
			}

			export interface Get {
				id: number;
			}

			export interface Cancel {
				id: number;
			}

			export interface Upcoming {
				limit: number;
			}

			export namespace Itinerary {
				export interface UserAddressCreate extends Omit<UserAddress.Req.Create, 'name' | 'userId'> {}

				export interface Get {
					reservationId?: number;
					itineraryId?: string;
				}

				interface Stay {
					accommodationId: number;
					numberOfAccommodations: number;
					rateCode: string;
					arrivalDate: Date | string;
					departureDate: Date | string;
					adultCount: number;
					childCount: number;
					upsellPackages?: UpsellPackage[];
					guest: Guest;
					additionalDetails?: string;
				}

				export interface Create {
					userId?: number;
					signUp?: 0 | 1;
					existingAddressId?: number;
					newAddress?: UserAddressCreate;
					paymentMethodId?: number;
					payment?: Api.Payment.Req.Create;
					destinationId: number;
					stays: Stay[];
				}
			}

			export interface UpsellPackage {
				id: number;
				date?: string | Date;
				time?: string;
			}
		}
		export namespace Res {
			export interface Get {
				id: number;
				userId: number;
				guest: Guest;
				billingAddress: BillingAddressDetails;
				paymentMethod?: PaymentMethod;
				destination: DestinationDetails;
				accommodation: AccommodationDetails;
				rateCode: string;
				arrivalDate: Date | string;
				departureDate: Date | string;
				status: string;
				canceledOn: Date | string;
				externalReservationId: string;
				externalCancellationId: string;
				adultCount: number;
				childCount: number;
				externalConfirmationId: string;
				confirmationDate: Date | string;
				nightCount: number;
				priceDetail: PriceDetail;
				itineraryId: string;
				cancellationPermitted: 0 | 1;
				upsellPackages: UpsellPackage.Res.Complete[];
				additionalDetails: string;
				numberOfAccommodations: number;
			}

			export interface Availability {
				[key: string]: Redis.Availability;
			}

			export interface Verification {
				accommodationId: number;
				accommodationName: string;
				destinationName: string;
				arrivalDate: string | Date;
				departureDate: string | Date;
				rateCode: string;
				adultCount: number;
				childCount: number;
				maxOccupantCount: number;
				upsellPackages: UpsellPackage.Res.Complete[];
				prices: PriceDetail;
				policies: { type: Model.DestinationPolicyType; value: string }[];
				checkInTime: string;
				checkOutTime: string;
			}

			export interface Create {
				id: number;
				externalReservationId: string;
				confirmationCode?: string;
			}

			export interface CostPerNight {
				accommodationCostInCents: number;
				taxesAndFeesInCents: number;
				totalInCents: number;
			}

			export interface Policies {
				guaranteePolicy: string;
				cancelPolicy: string;
			}

			export interface Cancel {
				cancellationId: string;
			}

			export interface Upcoming extends Get {}

			export namespace Itinerary {
				interface Stay {
					reservationId: number;
					accommodation: AccommodationDetails;
					arrivalDate: Date | string;
					departureDate: Date | string;
					status: string;
					canceledOn: Date | string;
					rateCode: string;
					externalReservationId: string;
					externalCancellationId: string;
					guest: Guest;
					adultCount: number;
					childCount: number;
					externalConfirmationId: string;
					confirmationDate: Date | string;
					upsellPackages: UpsellPackage.Res.Complete[];
					priceDetail: PriceDetail;
					cancellationPermitted: 0 | 1;
					review: { id: number; rating: number; message: string } | null;
					additionalDetails: string;
				}

				export interface Get {
					parentReservationId: number;
					userId: number;
					itineraryId: string;
					billingAddress: BillingAddressDetails;
					paymentMethod?: PaymentMethod;
					destination: DestinationDetails;
					stays: Itinerary.Stay[];
				}
			}
		}
	}

	export namespace Review {
		export interface Guest {
			id: number;
			firstName: string;
			lastName: string;
			accountNumber: string;
			primaryEmail: string;
			phone: string;
		}

		export interface StayDetails {
			id: number;
			name: string;
		}

		export interface Details {
			id: number;
			guest: Guest;
			destination: StayDetails;
			accommodation: StayDetails;
			packages: StayDetails[] | null;
			reservationId: number;
			message: string;
			rating: number;
			createdOn: Date | string;
			modifiedOn: Date | string | null;
			verifiedOn: Date | string | null;
			status: Model.ReviewStatus;
			stayStartDate: Date | string;
			stayEndDate: Date | string;
		}

		export namespace Req {
			export interface Create {
				reservationId: number;
				message: string;
				rating: number;
			}

			export interface Update {
				id: number;
				message?: string;
				rating?: number;
			}

			export interface Delete {
				id: number;
			}

			export interface ForDestination {
				destinationId: number;
			}

			export interface ForUser {
				userId: number;
			}

			export interface Reservation {
				reservationId: number;
			}

			export interface Get {
				id: number;
			}

			export interface Verify {
				reviewId: number;
			}

			export interface UnPublish {
				reviewId: number;
			}

			export interface Publish {
				reviewId: number;
			}
		}
		export namespace Res {
			export interface Get extends Details {}

			export interface Create extends Get {}

			export interface Update extends Get {}

			export interface ForDestination {
				name: string;
				description: string;
				code: string;
				status: string;
				logoUrl: string;
				heroUrl: string;
				reviewRating: number;
				reviewCount: number;
				reviews: Omit<Details, 'destination'>[];
			}
		}
	}

	export namespace Reward {
		export namespace Req {
			export interface Get {
				id?: number;
				ids?: number[];
			}

			export interface Paged extends RedSky.PageQuery {}

			export interface CustomerPaged {
				pagination: RedSky.PagePagination;
				vendorBrandIds?: number[];
				vendorDestinationIds?: number[];
				rewardCategoryIds?: number[];
				minPointCost?: number | null;
				maxPointCost?: number | null;
			}

			export interface Create {
				name: string;
				pointCost: number;
				monetaryValueInCents: number;
				destinationId?: number;
				brandId?: number;
				description: string;
				redemptionInstructions?: string;
				upc: string;
				mediaDetails?: MediaDetails[];
				categoryIds: number[];
			}

			export interface Update extends Partial<Omit<Model.Reward, 'id' | 'companyId' | 'destinationId'>> {
				id: number;
				destinationId?: number;
				mediaDetails?: MediaDetails[];
				categoryIds?: number[];
			}

			export interface Delete {
				id: number;
			}
		}
		export namespace Res {
			export interface Voucher {
				id: number;
				customerUserId: number;
				isActive: 0 | 1;
				isRedeemed: 0 | 1;
				code: string;
			}

			export interface Get {
				id: number;
				name: string;
				pointCost: number;
				monetaryValueInCents: number;
				destinationId?: number;
				brandId?: number;
				description: string;
				redemptionInstructions: string;
				upc: string;
				isActive: 0 | 1;
				createdOn: Date | string;
				modifiedOn: Date | string;
				vendorName: string;
				media: Media[];
				categoryIds: number[];
				vouchers: Model.RewardVoucher[];
			}

			export interface GetByPage {
				data: Get[];
				total?: number | undefined;
			}

			export interface Create extends Omit<Get, 'modifiedOn'> {}

			export interface Update extends Get {}
		}
		export namespace Voucher {
			export namespace Req {
				export interface Create {
					rewardId: number;
					codes: string[];
				}

				export interface Delete {
					rewardId: number;
					code: string | number;
				}

				export interface Claim {
					code: string;
					rewardId: number;
				}
			}
			export namespace Res {
				export interface Get extends Model.RewardVoucher {}

				export interface Create extends Get {}

				export interface Delete {
					rewardId: number;
					code: string;
				}

				export interface Claim extends Model.RewardVoucher {}
			}
		}
		export namespace Category {
			export namespace Req {
				export interface Create {
					name: string;
					mediaDetails?: MediaDetails[];
					isFeatured?: 0 | 1;
					isActive?: 0 | 1;
				}

				export interface Delete {
					id: number;
				}

				export interface Update {
					id: number;
					name?: string;
					isActive?: 0 | 1;
					isFeatured?: 0 | 1;
					mediaDetails?: MediaDetails[];
				}

				export interface Get {
					id?: number;
					ids?: number[];
				}
			}
			export namespace Res {
				export interface Get extends Model.RewardCategory {
					media: Media[];
				}

				export interface Create extends Get {}

				export interface Update extends Get {}
			}
		}
	}

	export namespace SystemActionLog {
		export namespace Req {
			export interface Create {
				userId: number;
				action: Model.SystemActionLogActions;
				source: string; // should be a DbTableName or service
				sourceId?: number;
				metaData?: any;
			}

			export interface Get {
				id?: number;
				ids?: number[];
			}

			export interface Update extends Omit<Model.SystemActionLog, 'id'> {
				id?: number;
				ids?: number[];
			}

			export interface Delete {
				id?: number;
				ids?: number[];
			}
		}
		export namespace Res {
			export interface Get extends Model.SystemActionLog {}
		}
	}

	export namespace Tier {
		export namespace Req {
			export interface Create {
				name: string;
				description?: string;
				accrualRate: number;
				threshold: number;
				isAnnualRate?: 0 | 1;
				featureIds: number[];
				mediaDetails?: MediaDetails[];
			}

			export interface Get {
				id: number;
			}

			export interface Update extends Partial<Omit<Model.Tier, 'createdOn' | 'modifiedOn'>> {
				id: number;
				accrualRate?: number;
				featureIds?: number[];
				mediaDetails?: MediaDetails[];
			}

			export interface Delete {
				id: number;
			}

			export interface CreateFeature {
				name: string;
			}

			export interface GetFeature {
				id: number;
			}

			export interface UpdateFeature {
				id: number;
				name: string;
			}

			export interface DeleteFeature {
				id: number;
			}
		}
		export namespace Res {
			export interface Get extends Model.Tier {
				accrualRate: number;
				features: Model.TierFeature[];
				mediaDetails: MediaDetails[];
			}

			export interface CreateFeature extends Model.TierFeature {}

			export interface GetFeatures extends Model.TierFeature {}

			export interface GetFeature extends Model.TierFeature {}

			export interface UpdateFeature extends Model.TierFeature {}
		}
	}

	export namespace Transaction {
		export namespace Req {}
		export namespace Res {
			export type OffsiteResponse = true | false;
		}
	}

	export namespace UpsellPackage {
		export interface Details extends Model.UpsellPackage {
			media: Media[];
		}

		export namespace Req {
			export interface Update {
				id: number;
				title?: string;
				description?: string;
				isActive?: 1 | 0;
				startDate?: string | Date;
				endDate?: string | Date;
				mediaIds?: MediaDetails[];
			}

			export interface Get {
				id?: number;
				ids?: number[];
			}

			export interface Availability {
				destinationId: number;
				packageIds?: number[];
				excludePackageIds?: number[];
				startDate: Date | string;
				endDate: Date | string;
				pagination?: RedSky.PagePagination;
			}
		}
		export namespace Res {
			export interface Update extends Details {}

			export interface Get extends Details {}

			export interface Complete extends Details {
				priceDetail: PriceDetail;
			}

			export interface PriceDetail {
				amountBeforeTax: number;
				amountAfterTax: number;
				amountPoints: number;
			}
		}
	}

	export namespace User {
		export interface Permission {
			key: string;
			read: boolean | number;
			write: boolean | number;
		}

		export interface Address {
			id: number;
			name: string;
			type: Model.UserAddressType;
			address1: string;
			address2: string;
			city: string;
			state: string;
			zip: number;
			country: string;
			isDefault: 1 | 0;
		}

		export interface Filtered {
			id: number;
			companyId?: number;
			tierId: number;
			userRoleId: number;
			firstName: string;
			lastName: string;
			primaryEmail: string;
			accountNumber: string;
			phone: string;
			notes: string;
			token: string;
			createdOn: Date | string;
			modifiedOn: Date | string;
			joinedOn: Date | string;
			birthDate: Date | string;
			lastLoginOn: Date | string;
			permissionLogin: boolean | number;
			permission: Permission[] | [];
			address: Address[] | [];
			lifeTimePoints: number;
			availablePoints: number;
			pendingPoints: number;
			city: string;
			state: string;
			loginExpiresOn: Date | string;
			loginVerificationExpiresOn: Date | string;
			paymentMethods: PaymentMethod[];
			allowEmailNotification: 0 | 1;
		}

		export interface Model extends Model.User {
			permission: Permission[];
			address: Address[] | [];
			city: string;
			state: string;
		}

		export interface PaymentMethod {
			id: number;
			userAddressId: number;
			nameOnCard: string;
			type: string;
			last4: number;
			expirationMonth: number;
			expirationYear: number;
			cardNumber: string;
			isPrimary: 0 | 1;
			createdOn: Date | string;
			systemProvider: string;
		}

		export interface Business
			extends Omit<Model.UserBusiness, 'createdOn' | 'creatingUserId' | 'revokedOn' | 'revokingUserId'> {
			name: string;
		}

		export namespace Req {
			export interface Create {
				userRoleId?: number;
				firstName: string;
				lastName: string;
				primaryEmail: string;
				password: string;
				phone?: string;
				birthDate?: Date | string;
				address?: Api.UserAddress.Req.Create;
				emailNotification?: 0 | 1;
			}

			export interface GetOrCreate
				extends Pick<Create, 'firstName' | 'lastName' | 'primaryEmail' | 'address' | 'phone'> {
				enroll: 0 | 1;
			}

			export interface Update {
				id?: number;
				ids?: number[];
				userRoleId?: number;
				firstName?: string;
				permissionLogin?: 0 | 1;
				lastName?: string;
				primaryEmail?: string;
				phone?: string;
				birthDate?: Date | string;
				allowEmailNotification?: 0 | 1;
			}

			export interface Role {}

			export interface Login {
				username: string;
				password: string;
			}

			export interface Get {
				id?: number;
				ids?: number[];
			}

			export interface Delete {
				id?: number;
				ids?: number[];
			}

			export interface ForgotPassword {
				primaryEmail: string;
			}

			export interface ResetPassword {
				passwordResetGuid: string;
				newPassword: string;
			}

			export interface UpdatePassword {
				old: string;
				new: string;
			}

			export interface ValidateGuid {
				guid: string;
			}

			export interface UserEmail {
				primaryEmail: string;
			}

			export interface Verify {
				userId: number;
				status: 'APPROVED' | 'DENIED' | 'HOLD';
			}

			export interface GetByPage {
				pagination: string;
				sort: string;
				filter: string;
			}

			export interface VerifyLogin {
				guid: string;
			}

			export interface UserPoints {
				userId?: number;
			}
		}
		export namespace Res {
			export interface Company {
				companyId: number;
			}

			export interface Get extends Filtered {}

			export interface Detail extends Get {
				tierTitle: string;
				tierBadge: Media;
				pendingPoints: number;
				nextTierThreshold: number | null;
				nextTierTitle: string;
				pointsExpiring: number;
				pointsExpiringOn: Date | string;
				paymentMethods: PaymentMethod[];
			}

			export interface GetOrCreate {
				id: number;
				enrolled: boolean;
			}

			export interface Role extends Model.UserRole {}

			export interface Login extends Detail {}

			export interface AdminLogin extends Filtered {
				businessAccesses: Business[];
			}

			export interface ForgotPassword extends Filtered {}

			export interface ResetPassword extends Filtered {}

			export interface ValidateGuid extends Filtered {}

			export interface GetByPage extends Omit<Filtered, 'paymentMethods'> {}

			export interface VerifyLogin extends Filtered {}

			export interface UserPoint extends Model.UserPoint {}
		}
	}

	export namespace UserAddress {
		export namespace Req {
			export interface Create {
				name?: string;
				userId?: number;
				type: Model.UserAddressType;
				address1: string;
				address2?: string;
				city: string;
				state?: string;
				zip: number;
				country: string;
				isDefault: 0 | 1;
			}

			export interface Get {
				id?: number;
				ids?: number[];
			}

			export interface Update {
				id: number;
				name?: string;
				type?: Model.UserAddressType;
				address1?: string;
				address2?: string;
				city?: string;
				state?: string;
				zip?: number;
				country?: string;
				isDefault: boolean | number;
			}

			export interface Delete {
				id: number;
			}
		}
		export namespace Res {
			export interface Get extends Model.UserAddress {}

			export interface Create extends Model.UserAddress {}

			export interface Update extends Model.UserAddress {}
		}
	}

	export namespace UserBusiness {
		export namespace Req {
			export interface Create extends Omit<Model.UserBusiness, 'id'> {}
		}
		export namespace Res {}
	}

	export namespace UserCampaign {
		export namespace Req {
			export interface Get {}
		}

		export namespace Res {
			export interface Get extends Model.UserCompletedCampaign {
				completionPoints: number;
			}
		}
	}

	export namespace UserPoint {
		export namespace Req {
			export interface Create {
				userId: number;
				pointType: Model.PointTypes;
				pointAmount: number;
				reason: Model.PointReason;
				description?: string;
				notes?: string;
				award: 0 | 1;
			}

			export interface Get {
				id?: number;
				ids?: number[];
			}

			export interface GetByPage {
				pagination: string;
				sort: string;
				filter: string;
			}
		}
		export namespace Res {
			export interface Get extends Model.UserPoint {}

			export interface Create extends Model.UserPoint {}

			export interface Verbose extends Model.UserPoint {
				title: string;
				arrivalDate: Date | string;
				departureDate: Date | string;
				media: Media[];
			}
		}
	}

	export namespace Vendor {
		export namespace Res {
			export interface Get {
				name: string;
				destinationId: number | null;
				brandId: number | null;
			}

			export interface GetByPage {
				data: Get[];
				total: number;
			}
		}
	}
}
