import ReservationSystem from '../reservationSystem/reservationSystem.class';

export namespace ISpreedly {
	type StorageState = 'retained' | 'redacted' | 'cached';

	export interface ServiceDetails {
		baseUrl: string;
		environmentKey: string;
		apiKey: string;
	}

	export interface ProgramId extends String {}

	export interface IntegratedService {
		getReceiver(companyDetails: RedSky.IntegrationCompanyDetails): Models.Receiver;
	}

	export interface ReceiverRequestTemplate extends String {}

	export interface IntegratedReservationSystem extends IntegratedService, ReservationSystem {
		// WE DO NOT CHARGE PAYMENTS - We simply need to append the paymentMethod to the reservation and its taken care of down stream
		formatReservationChargeRequest(
			reservationId: number,
			amountInCents: number,
			companyDetails: RedSky.IntegrationCompanyDetails
		): Promise<[template: ReceiverRequestTemplate, url: string, headers: string[]]>;

		formatAppendPaymentMethodRequest(
			companyDetails: RedSky.IntegrationCompanyDetails,
			spireReservation: Model.Reservation,
			paymentMethod: Model.UserPaymentMethod
		): Promise<[template: ReceiverRequestTemplate, url: string, headers: string[]]>;
	}

	export namespace Models {
		export interface StandardError {
			key: string;
			message: string;
		}

		export interface Error {
			errors: StandardError[];
		}

		export namespace Store {
			export interface BasePaymentMethod {
				token: string;
				created_at: Date | string;
				updated_at: Date | string;
				email: string;
				data: any;
				storage_state: StorageState;
				test: boolean;
				metadata: any;
				callback_url: string;
				last_four_digits: number;
				first_six_digits: number;
				card_type: string;
				first_name: string;
				last_name: string;
				month: number;
				year: number;
				address1: string;
				address2: string;
				city: string;
				state: string;
				zip: string;
				country: string;
				phone_number: string;
				company: string;
				full_name: string;
				eligible_for_card_updater: boolean;
				shipping_address1: string;
				shipping_address2: string;
				shipping_city: string;
				shipping_state: string;
				shipping_zip: string;
				shipping_country: string;
				shipping_phone_number: string;
				payment_method_type: string;
				errors: any[];
				fingerprint: string;
				verification_value: string;
				number: string;
			}

			export interface ThirdPartyPayment {
				token: string;
				created_at: Date | string;
				updated_at: Date | string;
				gateway_type: string;
				storage_state: StorageState;
				metadata: any;
				third_party_token: string;
				payment_method_type: string;
				errors: any[];
			}

			export interface Response {
				success: boolean;
				message: string;
				avs_code: any;
				avs_message: string;
				cvv_code: any;
				cvv_message: string;
				pending: boolean;
				result_unknown: boolean;
				error_code: string;
				error_detail: string;
				cancelled: boolean;
				fraud_review: string;
				created_at: Date | string;
				updated_at: Date | string;
				body?: string;
			}
		}

		export interface Receiver {
			company_name: string;
			receiver_type: string;
			token: string;
			hostnames: string;
			state: string;
			created_at: Date | string;
			updated_at: Date | string;
			credentials: { name: string; value?: string; safe: boolean }[];
			ssl_certificate_token: string;
		}
	}
	export namespace Store {
		export interface Req {
			transaction: {
				recurring_processing_model: string;
				payment_method_token: string;
				currency_code: string;
				gateway_specific_fields: {
					adyen: {
						shopper_reference: number;
						recurring_processing_model: string;
						shopper_statement: string;
						address1?: string;
						address2?: string;
						city?: string;
						state?: string;
						zip?: string;
						country?: string;
					};
				};
			};
		}

		export interface Res {
			transaction: {
				created_at: Date | string;
				currency_code: string;
				updated_at: Date | string;
				succeeded: boolean;
				token: string;
				state: string;
				gateway_specific_fields: {
					adyen: {
						shopper_reference: number;
						recurring_processing_model: string;
						shopper_statement: string;
					};
				};
				gateway_specific_response_fields: { adyen: {} };
				transaction_type;
				string;
				third_party_token: any;
				gateway_transaction_id: string;
				gateway_latency_ms: number;
				message: string;
				gateway_token: string;
				gateway_type: string;
				payment_method?: Models.Store.ThirdPartyPayment;
				basis_payment_method: Models.Store.BasePaymentMethod;
				response: Models.Store.Response;
			};
		}
	}
	export namespace Show {
		export interface Res {
			payment_method: Models.Store.BasePaymentMethod;
		}
	}
	export namespace Delivery {
		export type RequestMethodTypes = 'PUT' | 'PATCH' | 'POST';
		export interface Req {
			delivery: {
				payment_method_token: string;
				url: string;
				headers: string;
				body: string;
				request_method?: RequestMethodTypes; // Defaults to POST
			};
		}

		export interface Res {
			transaction: {
				token: string;
				transaction_type: string;
				state: string;
				created_at: Date | string;
				updated_at: Date | string;
				succeeded: boolean;
				message: string;
				url: string;
				response: {
					status: number;
					headers: string;
					body: string; // IFidel.Res.Register;
				};
				receiver: Models.Receiver;
				payment_method: Models.Store.BasePaymentMethod;
			};
		}

		export namespace Res {
			export interface Body {}
		}
	}
	export namespace Charge {}
	export namespace Retain {
		export namespace Req {
			export interface Retain {
				paymentToken: string;
			}
		}
		export namespace Res {
			export interface Retain {
				transaction: {
					token: string;
					created_at: Date | string;
					updated_at: Date | string;
					succeeded: boolean;
					transaction_type: string;
					state: string;
					message_key: string;
					message: string;
					payment_method: {
						token: string;
						created_at: Date | string;
						updated_at: Date | string;
						email: string;
						data: any;
						storage_state: string;
						test: boolean;
						metadata: any;
						callback_url: any;
						last_four_digits: string;
						first_six_digits: string;
						card_type: string;
						first_name: string;
						last_name: string;
						month: number;
						year: number;
						address1: string;
						address2: string;
						city: string;
						state: string;
						zip: string;
						country: string;
						phone_number: string;
						company: string;
						full_name: string;
						eligible_for_card_updater: boolean;
						shipping_address1: string;
						shipping_address2: string;
						shipping_city: string;
						shipping_state: string;
						shipping_zip: string;
						shipping_country: string;
						shipping_phone_number: string;
						payment_method_type: string;
						errors: [];
						fingerprint: string;
						verification_value: string;
						number: string;
					};
				};
			}
		}
	}
}
