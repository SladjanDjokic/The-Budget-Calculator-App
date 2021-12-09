import { ISpreedly } from '../spreedly/ISpreedly';

export namespace ISabre {
	type TokenTypes = 'bearer';
	type AccommodationSearchRateClassType =
		| 'Association'
		| 'BAR'
		| 'Club'
		| 'Convention'
		| 'Corporate'
		| 'Family'
		| 'Government'
		| 'LoyaltyAccrual'
		| 'Military'
		| 'Negotiated'
		| 'Package'
		| 'PointsAndCashRedemption'
		| 'PointsRedemption'
		| 'Promotional'
		| 'Rack'
		| 'Senior'
		| 'Tour'
		| 'TravelIndustry'
		| 'Unassigned'
		| 'Weekend';
	export type AccommodationType =
		| 'Double'
		| 'Futon'
		| 'King'
		| 'Murphy Bed'
		| 'Other'
		| 'Queen'
		| 'Single'
		| 'Sofa Bed'
		| 'Tatami Mats'
		| 'Twin'
		| 'Waterbed';
	export type DestinationStatusType = 'Open';
	export type ReservationStatus =
		| 'Booked'
		| 'Cancelled'
		| 'Confirmed'
		| 'Ignored'
		| 'OnHold'
		| 'PendingModify'
		| 'Waitlisted';
	export type AgeCode = 'Child' | 'Adult' | 'Senior';
	export type ChargeFrequency = 'Unknown' | 'PerStay' | 'PerNight';
	export type ChargeType =
		| 'Unknown'
		| 'Flat'
		| 'PerQuantityName'
		| 'PerPerson'
		| 'PerOccupancyType'
		| 'PerPersonOccupancy'
		| 'PerAdultOccupancy'
		| 'PerChildOccupancy'
		| 'PerRoom';
	export type ServicePricingType = 'Per stay' | 'Per night' | 'Per person' | 'Per person per night';
	export type GuestRole = 'Primary' | 'Additional';
	export type AddressType =
		| 'Home'
		| 'Billing'
		| 'BillingTax'
		| 'Business'
		| 'Chain'
		| 'Collection'
		| 'Contact'
		| 'CreditCard'
		| 'Delivery'
		| 'Deposit'
		| 'Hotel'
		| 'Mailing'
		| 'OtherUse'
		| 'Permanent'
		| 'Physical'
		| 'PreOpeningOffice';
	export type ContactNumberRole = 'Unknown' | 'Home' | 'Office';
	export type ContactNumberType = 'Unknown' | 'Voice' | 'Fax' | 'Mobile' | 'Voice1' | 'Voice2';
	export type EmailAddressType = 'Mobile' | 'Primary';
	export type RateType = 'Public' | 'Corporate' | 'Group';

	export interface ServiceDetails {
		username: string;
		password: string;
		baseRestUrl: string;
		baseSoapUrl: string;
		apiVersion: string;
	}

	export interface DestinationServiceDetails extends ServiceDetails {
		chainIds: number[];
		primaryChannel: 'WEB';
		secondaryChannel: 'SYNXISWS_VA';
	}

	export interface ReservationServiceDetails extends ServiceDetails {
		chainIds: number[];
		primaryChannel: 'WEB';
		secondaryChannel: 'SYNXISWS_VA';
		receiver: ISpreedly.Models.Receiver;
		programId: ISpreedly.ProgramId;
	}

	export namespace Model {
		export interface AccessToken {
			access_token: string;
			token_type: TokenTypes;
			expires_in: number;
			unique_uid: string;
			Result: any;
			Warnings: {
				Code: string;
				UserMessage: string;
			}[];
			ApplicationResult: {
				Username: string;
				ActivityId: string;
				AccessToken: string;
				TokenType: TokenTypes;
				ExpiresIn: number;
				UniqueID: string;
				mfatoken: boolean;
				PasswordExpirationDate: number;
			};
		}
		export interface AccessTokenError {
			error: string;
			error_description: string;
			Result: {
				ResultCode: string;
				Description: string;
			};
			Errors: {
				Status: string;
				ReportingSystem: string;
				Type: string;
				ErrorCode: string;
				Instance: string;
				Message: string;
			}[];
		}

		export interface BasePriceObject {
			Price: {
				Fees: {
					BreakDown?: PriceBreakDownItem[];
					Amount: number;
				};
				Tax: {
					BreakDown?: PriceBreakDownItem[];
					Amount: number;
				};
				Total: {
					Amount: number;
					AmountWithTaxesFees: number;
					AmountWithInclusiveTaxes?: number;
				};
				Amount: number;
				CurrencyCode: string;
			};
		}

		export interface CancelPolicy {
			CancelFeeAmount: { TaxInclusive: boolean; value: number };
			CancelFeeType: string;
			CancelPenaltyDate: Date | string;
			CancelTime: string;
			CancelTimeIn: string;
			ChargeThreshold: string;
			ChargeType: string;
			Description: string;
			ModificationRestrictions: string;
			NoShowFeeAmount: {
				TaxInclusive: boolean;
				Value: number;
			};
			NoShowFeeType: string;
			Charges: {
				DaysToArrive: number;
				CancelFeeIncludesTax: boolean;
				CancelFeeAmount: number;
			}[];
			CancellationPermitted: boolean;
			Code: string;
			LateCancellationPermitted: boolean;
		}

		export interface PriceBreakDownItem {
			Amount: number;
			Code: string;
		}

		export interface Bedding {
			Description: string;
			Code: string;
			Quantity: string;
			Type: string;
			IsPrimary: boolean;
		}

		export interface ContentList {
			croList: any;
			currencyList: any;
			destinationList: any;
			paymentMethodList: any;
			languageList: any;
			brandList: any;
			chainList: any;
		}

		export type Attribute = {
			Id: number;
			Category: Attribute.Category;
			Name: string;
			Value: string;
			DataType: Attribute.DataType;
		};

		export namespace Attribute {
			export type Category =
				| 'LocalPolicies'
				| 'Location'
				| 'GeneralFacilities'
				| 'PhysicallyChallengedFacilities'
				| 'Ratings'
				| 'Safety';
			export type DataType = 'Boolean' | 'String' | 'Int' | 'Decimal' | 'Money';
		}

		export interface Destination {
			ActiveDate: {
				StartDate: Date | string;
				EndDate: Date | string;
			};
			AlertList: any;
			Attributes: Attribute[];
			BrandList: any;
			CROList: any;
			ChainList: Array<{ ID: number; Primary: boolean }>;
			Channels: any;
			PropertyFeatures: any;
			DestinationList: any;
			DiningOptionList: any;
			Location: DestinationLocation;
			LanguageList: any;
			MealPlanList: any;
			PaymentMethodList: any;
			RecreationList: any;
			ReferencePointList: any;
			ServiceList: any;
			Status: DestinationStatusType;
			TerminalList: any;
			Code: string;
			PmsCode: string;
			ID: string;
			Name: string;
			ShortName: string;
			Descriptions: any;
		}

		export interface DestinationLocation {
			Address: {
				AddressLine: string[];
				City: string;
				CountryName: {
					Code: string;
					Value: string;
				};
				PostalCode: string;
				StateProv: {
					Code: string;
					Value: string;
				};
			};
			Latitude: number;
			Longitude: number;
			TimeZone: string;
			Type: string;
		}

		export interface GenericError {
			ErrorCode: string;
			Message: string;
			TimeStamp: Date | string;
		}

		export interface GuestLimit {
			ChildrenIncluded: boolean;
			Adults: number;
			Children: number;
			GuestLimitTotal: number;
			Value: number;
		}

		export interface LeastRestrictiveFailure {
			AdditionalInformation: string;
			Level: string;
			ProductStatus: string;
			Date: Date | string;
		}

		export interface Links {
			href: string;
			rel: 'self' | 'read';
		}

		export interface Paging {
			Size: number;
			Start: number;
			Total: number;
		}

		export interface PagingSmall {
			total: number;
			start: number;
			size: number;
		}

		export interface ProductAvailable {
			Product: {
				Prices: ProductPrices;
				Rate: ProductRate;
				Room: ProductRoom;
				StayLimits: StayLimits;
			};
			Available: boolean;
			AvailableInventory: number;
			IsMaximumPricedItem: boolean;
			IsMinimumPricedItem: boolean;
			SortSequenceNumber: number;
		}

		interface StayLimits {
			MinimumStay: number;
			MaximumStay: number;
		}

		export interface ProductPrices {
			Daily: ProductPricesDaily[];
			PerNight: BasePriceObject;
			Total: BasePriceObject;
			TaxesFeesIncluded: boolean;
		}

		export interface ProductPricesDaily extends BasePriceObject {
			Date: Date | string;
			AvailableInventory: number;
		}

		export interface ProductRate {
			Code: string;
		}

		export interface ProductRoom {
			Code: string;
		}

		export interface Rate {
			Details: {
				BookingMethod: string;
				CommissionablePercentage: number;
				ChannelList: Array<Channel>;
				Currency: {
					CurrencyCode: 'string';
				};
				Description: string;
				DetailedDescription: string;
				Hotel: { Id: number };
				Indicators: {
					AutoEnrollmentEnabled: boolean;
					Commissionable: boolean;
					Corporate: boolean;
					Group: boolean;
					Loyalty: boolean;
					LoyaltyAccrual: boolean;
					Monthly: boolean;
					Promotional: boolean;
					Redeemable: boolean;
					Restricted: boolean;
					Suppressed: boolean;
					TaxInclusive: boolean;
					AllowSingleUseCard: boolean;
					PointsOnly: boolean;
					ManagedInCRSOnly: boolean;
				};
				CompanyList: [];
			};
			ActiveBlocks: boolean;
			CategoryCode: string;
			CurrencyCode: string;
			Code: string;
			Name: string;
			SortSequenceNumber: number;
			PmsCode: string;
			Type: RateType;
		}

		export interface Room {
			Details: RoomDetail;
			Active: boolean;
			CategoryCode: string;
			Code: string;
			Name: string;
			SortOrder: number;
			PmsCode: string;
			DisplaySortOrder: number;
		}

		export interface RoomDetailSize {
			Max: number;
			Min: number;
			Units: string;
		}

		export interface RoomDetail {
			Description: string;
			DetailedDescription: string;
			GuestLimit: GuestLimit;
			ImageList: any;
			Hotel: { Id: number };
			Bedding: Bedding[];
			Class: {
				Code: string;
				Description: string;
			};
			ExtraBed: {
				Allowed: boolean;
				Cost: number;
			};
			FeatureList: any;
			ViewList: any;
			AdaCompliant?: boolean;
			AdaComplaint: boolean; // this is the wrong spelling, but its how Sabre sends their data. It will work both ways so if they ever fix it.
			Size?: RoomDetailSize;
		}

		export interface AccommodationType {
			links: Links[];
			code: string;
			isActive: string | boolean;
			name: string;
		}

		export type Channel = {
			Code: string;
			Description?: string;
			Name?: string;
		};

		export type DynamicPackage = {
			Code: string;
			Date: Date | string;
			Name: string;
			Quantity: number;
			QuantityName: string;
			redeemLoyalty: boolean;
			time: string;
			ChargeFrequency: ChargeFrequency;
			ChargeType: ChargeType;
			Price: {
				CurrencyCode: string;
				TotalAmountIncludingTaxesFees: number;
				TotalAmount: number;
			};
		};

		export type Guest = {
			Role: GuestRole;
			PersonName: {
				GivenName: string;
				MiddleName: string;
				Prefix: string;
				Surname: string;
			};
			Locations: Array<{
				id?: string;
				Address: {
					AddressLine: string[];
					City: string;
					Country: { Code: string };
					Default: boolean;
					PostalCode: string;
					StateProv: { Code: string };
					Type: AddressType;
				};
				Name: string;
			}>;
			ContactNumbers: Array<{
				Number: string;
				Role: ContactNumberRole;
				Type: ContactNumberType;
			}>;
			EmailAddress: Array<{
				Default?: boolean;
				Type: EmailAddressType;
				Value: string;
			}>;
			Payments?: Payment[];
		};

		export interface Payment {
			Amount: number;
			PaymentCard: PaymentCard;
			Role: 'Personal';
			Type: 'CreditCard';
		}

		export interface PaymentCard {
			Token: string;
			CardHolder: string;
			ExpireDate: string;
		}

		export interface Product {
			RateCode: string;
			RoomCode: string;
		}

		export interface Tax {
			Code: string;
			Name: string;
		}

		export namespace Reservation {
			export interface Activity {
				Type: string;
				Value: string;
			}
			export interface BreakdownPrice {
				Fees: {
					Breakdown: {
						Description: string;
						Amount: number;
						Code: string;
						Level: string;
						Name: string;
						Type: string;
					}[];
					Amount: number;
					StayFeeAmount?: number;
				};
				Tax: {
					Breakdown: {
						Description: string;
						Amount: number;
						Code: string;
						Level: string;
						Name: string;
						Type: string;
					}[];
					Amount: number;
					StayTaxAmount?: number;
				};
				TotalAmount?: number;
				TotalAmountWithInclusiveTaxesFees?: number;
				TotalAmountIncludingTaxesFees?: number;
				OriginalAmountIncludingTaxesAndFees?: number;
			}
			export interface BreakdownProductPrices {
				Price: BreakdownPrice;
				Product: Model.Product;
				StartDate?: Date | string;
			}
			export interface Channels {
				PrimaryChannel: Channel;
				SecondaryChannel: Channel;
			}
			export interface Content {
				Rooms: {
					DetailedDescription: string;
					Description: string;
					CategoryCode: string;
					Code: string;
					Name: string;
				}[];
				Rates: {
					Description: string;
					DetailedDescription: string;
					Code: string;
					EffectiveDate: Date | string;
					ExpireDate: Date | string;
					Name: string;
					Primary: boolean;
				}[];
				RoomCategories: {
					Description: string;
					CategoryCode: string;
					Name: string;
				}[];
			}
			export interface DeliveryComment {
				Id: string;
				Comment: string;
			}
			export interface GuestCount {
				AgeQualifyingCode: AgeCode;
				NumGuests: number;
			}
			export interface Notification {
				LanguageCode: string;
				DeliveryComments: Array<DeliveryComment>;
			}
			export interface PriceBreakdown {
				Type: string;
				ProductPrices: BreakdownProductPrices[];
			}
			export interface Product {
				Product: {
					RateCode: string;
					RoomCode: string;
					Id: string;
				};
				StartDate: Date | string;
				EndDate: Date | string;
				Primary: boolean;
			}
			export interface PropertyInstructions {
				ChargeRoutingList: [];
			}
			export interface RoomPrices {
				PriceBreakdowns: PriceBreakdown[];
				TotalPrice: {
					Price: TotalPrice;
				};
				AveragePrice: TotalPrice;
			}
			export interface RoomStay {
				GuestCount: GuestCount[];
				NumRooms: number;
				EndDate: Date | string;
				StartDate: Date | string;
				Group: boolean;
				Suppressed: boolean;
				Products: Product[];
			}
			export interface TotalPrice extends BreakdownPrice {
				CurrencyCode: string;
				TaxesFeesIncluded: boolean;
				TotalAmount: number;
				TotalAmountWithInclusiveTaxesFees: number;
				TotalAmountIncludingTaxesFees: number;
				OriginalAmountIncludingTaxesAndFees?: number;
			}
		}
	}

	export namespace Accommodation {
		export namespace Req {}
		export namespace Res {
			export interface ForHotel {
				paging: Model.Paging;
				roomList: Model.Room[];
				contentList: {
					HotelList: {
						Code: string;
						Id: number;
						Name: string;
					}[];
				};
			}
			export interface SyncSabreAccommodationList {
				[key: number]: Model.Room[];
			}
		}
	}

	export namespace AccommodationType {
		export namespace Req {}
		export namespace Res {
			export interface ForHotel {
				links: Model.Links[];
				roomTypes: Model.AccommodationType[];
				pagination: Model.PagingSmall;
			}
		}
	}

	export namespace Destination {
		export namespace Req {
			export interface AccommodationSearch {
				primaryChannel: string;
				secondaryChannel: string;
				adults: number;
				chainId: number;
				hotelId: number;
				numRooms: number;
				startDate: Date | string; // yyyy-mm-dd
				endDate: Date | string; // yyyy-mm-dd
				children?: number;
				childrenAge?: number[];
				additionalAdults?: number[];
				additionalChildren?: number[];
				bookingDate?: Date | string; // yyyy-mm-dd
				couponCode?: string[];
				croId?: string;
				currencyCode?: string; // ISO-4217
				loyaltyProgram?: string;
				loyaltyLevel?: string[];
				onlyCheckRequested?: boolean;
				productStatus?: 'overridable' | 'policyviolated' | 'unavailable';
				roomClass?: 'ADACompliant';
				roomClassExcluded?: 'ADACompliant';
				sortProducts?: 'Product' | 'RatesThenRooms' | 'RoomsThenRates';
				sortResults?: 'Default' | 'AvailableFirst';
				rateCategoryCode?: string[];
				rateClass?: AccommodationSearchRateClassType[];
				rateClassExclude?: AccommodationSearchRateClassType[];
				rateCode?: string[];
				rateFilter?: string[];
				roomCategoryCode?: string[];
				roomCode?: string[];
				roomFeature?: string[];
				roomType?: AccommodationType[];
				roomView?: string[];
				priceRangeMin?: number;
				priceRangeMax?: number;
				priceRangeType?: 'Highest' | 'Average' | 'Total' | 'FirstNight' | 'Lowest' | 'HighestInclusiveTax';
				priceRangeCurrency?: 'HotelDefaultCurrency' | 'RequestedCurrency';
				templateCode?: string;
				templateLevel?: 'Chain' | 'Hotel';
				pageStart?: number; // 0 returns all
				pageSize?: number; // 0 returns all
			}
		}
		export namespace Res {
			export interface AccommodationSearch {
				productAvailability: {
					Hotel: { Id: number };
					LeastRestrictiveFailure: Model.LeastRestrictiveFailure;
					Paging: Model.Paging;
					Prices: Model.ProductAvailable[];
					AdditionalPrices: any;
					ProductResult: string;
				};
			}
			export interface HotelList {
				contentList: Model.ContentList;
				paging: Model.Paging;
				hotelList: Model.Destination[];
			}
		}
	}

	export namespace DynamicPackage {
		export interface Res {
			Envelope: {
				Header: any;
				Body: {
					OTA_HotelAvailRS: {
						Success?: '';
						Errors?: { Error: DynamicPackage.Error[] };
						Services: { Service: Service[] };
					};
				};
			};
		}
		export interface Service {
			RatePlanCode: string;
			Quantity: number;
			ServiceInventoryCode: string;
			ServicePricingType: ServicePricingType;
			ServiceDetails: ServiceDetails;
			Price: ServicePrice;
		}
		export interface ServiceDetails {
			Comments: { Comment: Comment[] };
			TimeSpan?: TimeSpan;
		}
		type ServiceDetailCommentName = 'Title' | 'Description' | 'Category' | 'Url' | 'Image';
		export interface Comment {
			Name: ServiceDetailCommentName;
			Text?: string;
			Url?: string;
			Image?: string;
		}
		export interface ServicePrice extends TimeSpan {
			Base: ServicePriceDetail;
		}
		export interface ServicePriceDetail {
			TaxInclusive: boolean;
			AmountBeforeTax: number;
			AmountAfterTax: number;
			CurrencyCode: string;
		}
		export interface TimeSpan {
			EffectiveDate: Date | string;
			ExpireDate: Date | string;
		}
		export interface Error {
			Type: number;
			ShortText: string;
			Code: number;
		}
	}

	export namespace Reservation {
		interface BaseReservationObject {
			CRS_confirmationNumber: string;
			Id: string;
			CrsConfirmationNumber: string;
			ItineraryNumber: string;
		}
		export namespace Req {
			export interface UpsellPackage extends Partial<Model.DynamicPackage> {
				Code: string;
				Date: string | Date;
				Quantity: number;
			}
			export interface Create {
				Chain: {
					Id: number;
				};
				Channels: {
					PrimaryChannel: Model.Channel;
					SecondaryChannel: Model.Channel;
				};
				Hotel: {
					Id: number;
					Code: string;
				};
				Packages: UpsellPackage[];
				Guests: Model.Guest[];
				Promotion: {};
				RoomStay: RoomStay;
				Notification?: {
					DeliveryComments: Array<{
						Comment: string;
						Id: string;
					}>;
				};
				status: ReservationStatus;
				ItineraryNumber?: string;
			}
			export interface Update extends Create {
				CrsConfirmationNumber: string;
			}
			export interface RoomStay {
				GuestCount: Model.Reservation.GuestCount[];
				NumRooms: number;
				startDate?: Date | string;
				endDate?: Date | string;
				CheckInDate: Date | string;
				CheckOutDate: Date | string;
				Products: Array<{
					StartDate: Date | string;
					EndDate: Date | string;
					Primary: boolean;
					Product: Model.Product;
				}>;
			}
			export interface Charge extends BaseReservationObject {
				Hotel: { Id: number; Code: string; Name: string };
				Channels: Model.Reservation.Channels;
				Guests: {
					CRS_referenceNumber: string;
					Payments: Model.Payment[];
				}[];
			}
			export interface Cancel {
				Hotel: { Id: number };
				CrsConfirmationNumber: string;
				CancellationDetails: {
					Comment: string;
				};
			}
		}
		export namespace Res {
			export interface Guest {
				Locations: {
					id?: string;
					Address: {
						AddressLine: string[];
						City: string;
						Country: { Code: string };
						Default: boolean;
						PostalCode: string;
						StateProv: { Code: string };
						Type: AddressType;
					};
					Name: string;
					Code?: string;
				}[];
				EmailAddress: {
					Default: boolean;
					Type: EmailAddressType;
					Value: string;
				}[];
				Payments?: Model.Payment[];
				PersonName: {
					GivenName: string;
					MiddleName: string;
					Prefix: string;
					Surname: string;
				};
				CRS_referenceNumber: string;
				Role: GuestRole;
				EndDate: Date | string;
				StartDate: Date | string;
				DenyChargeToRoom: boolean;
				MarketingOption: boolean;
				ContactNumbers: {
					Number: string;
					Code: string;
					Default: boolean;
					SortOrder: number;
					Role: ContactNumberRole;
					Type: ContactNumberType;
					Use: string;
				}[];
			}
			interface Price {
				Fees: {
					Breakdown: Array<{ Amount: number; Code: string; Name: string }>;
					Amount: number;
				};
				Tax: {
					Breakdown: Array<{ Amount: number; Code: string; Name: string }>;
					Amount: number;
				};
				TotalAmount: number;
				TotalAmountWithInclusiveTaxesFees: number;
				TotalAmountIncludingTaxesFees: number;
				OriginalAmountIncludingTaxesAndFees: number;
			}
			export interface Create {
				Links: {
					href: string;
					rel: string;
				};
				reservations: BaseReservationObject[];
			}
			export interface Update extends Create {}

			export interface Get extends BaseReservationObject {
				BookingDues: {
					Deposit: {
						DueDate: Date | string;
						Amount: number;
						AmountWithoutTax: number;
						Status: string;
					};
					CancelPenalty: {
						ChargeList: any[];
						Amount: number;
						Deadline: Date | string;
					};
					NoShowCharge: {
						Amount: number;
					};
				};
				BookingPolicy: {
					DepositFee: {
						Amount: number;
						DueDays: number;
						DueType: string;
						TaxInclusive: boolean;
						IsPrePayment: boolean;
						Type: string;
					};
					Description: string;
					TransactionFeeDisclaimer: string;
					GuaranteeLevel: string;
					HoldTime: string;
					Requirements: string[];
					Code: string;
					AllowPay: boolean;
				};
				BookingInfo: {
					BookedBy: string;
					BookingDate: Date | string;
					ModifiedBy: string;
					EntryChannelBookingDate: Date | string;
				};
				CancelPolicy: Model.CancelPolicy;
				CRSCancellationNumber: string;
				CommissionPolicy: {
					Commission: { Value: number; UnitType: string; CalculationType: string };
					Code: string;
					Description: string;
				};
				Chain: {
					Code: string;
					Id: number;
					Name: string;
				};
				Guests: Guest[];
				Content: Model.Reservation.Content;
				Currency: { Name: string; Symbol: string; Code: string };
				Overrides: any[];
				Hotel: { Id: number; Code: string; Name: string };
				Language: { Code: string; Name: string };
				RoomPrices: Model.Reservation.RoomPrices;
				Transportation: any;
				Notification: Model.Reservation.Notification;
				RoomStay: Model.Reservation.RoomStay;
				RuleTrackingList: any[];
				Source: { IP_Address: string; BookingUrl: string };
				OnPropertyInstructions: Model.Reservation.PropertyInstructions;
				AdministrativeActions: any[];
				CancellationPermitted: boolean;
				ChannelConfirmationNumber: string;
				Status: string;
				OnHoldReleaseTime: number;
				OnPropertyStatus: string;
				PurposeOfStay: string;
				SingleUserPaymentCardAllowed: boolean;
				SortOrder: number;
				Channels: Model.Reservation.Channels;
				Activity: Model.Reservation.Activity[];
				Packages: Model.DynamicPackage[];
			}

			export interface Cancel {
				CRSCancellationNumber: string;
			}

			export interface Rates {
				paging: Model.Paging;
				contentList: Model.ContentList;
				rateList: Array<Model.Rate>;
			}
		}
	}

	export namespace Tax {
		export namespace Res {
			export interface Get {
				Taxes: Model.Tax[];
				Pagination: Model.Paging;
			}
		}
	}
}
