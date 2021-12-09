import { ISpreedly } from '../spreedly/ISpreedly';

export namespace IFidel {
	export interface ServiceDetails {
		baseUrl: string;
		apiPrivateKey: string;
		apiPublicKey: string;
		receiver: ISpreedly.Models.Receiver;
		programId: string;
	}
	export namespace Model {
		export interface Brand {
			accountId: string;
			logoUrl: string;
			created: Date | string;
			name: string;
			live: boolean;
			consent: boolean;
			updated: Date | string;
			websiteURL: string;
			id: string;
		}
		export interface Location {
			currency: string;
			visa: {
				estimatedActivationDate: Date | string;
				clearingTransactionId: Date | string;
				auth: boolean;
				authTransactionId: string;
				clearing: boolean;
				status: string;
			};
			geolocation: {
				latitude: number;
				longitude: number;
			};
			city: string;
			stateCode: string;
			mastercard: {
				estimatedActivationDate: Date | string;
				clearingTransactionId: Date | string;
				auth: boolean;
				authTransactionId: string;
				clearing: boolean;
				status: string;
			};
			programId: string;
			amex: {
				estimatedActivationDate: Date | string;
				clearingTransactionId: Date | string;
				auth: boolean;
				authTransactionId: string;
				clearing: boolean;
				status: string;
			};
			searchBy: {
				MerchantIds: {
					mastercard: [];
					visa: [];
				};
			};
			id: string;
			preonboard: boolean;
			postcode: string;
			accountId: string;
			activeDate: Date | string;
			countryCode: string;
			created: Date | string;
			address: string;
			live: boolean;
			updated: Date | string;
			brandId: string;
			timezone: string;
			active: boolean;
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
		export interface RegisterItem {
			accountId: string;
			countryCode: string;
			expDate: Date | string;
			expMonth: number;
			expYear: number;
			firstNumbers: string;
			lastNumbers: string;
			live: boolean;
			programId: string;
			scheme: string;
			type: string;
			updated: Date | string;
			created: Date | string;
			id: string;
		}
	}

	export namespace Req {
		export interface Register {}
	}

	export namespace Res {
		export interface Register {
			items: Model.RegisterItem[];
			resource: string;
			status: number;
			execution: number;
		}
	}

	export namespace Brands {
		export namespace Req {
			export interface List {}
		}
		export namespace Res {
			export interface List {
				count: number;
				items: Model.Brand[];
				resource: string;
				status: number;
				execution: number;
			}
		}
	}

	export namespace Location {
		export namespace Req {
			export interface List {}
		}
		export namespace Res {
			export interface List {
				count: number;
				items: Model.Location[];
				resource: string;
				status: number;
				execution: number;
			}
		}
	}

	export namespace Transaction {
		export namespace Req {
			export interface Auth {
				accountId: string;
				auth: boolean;
				amount: number;
				cleared: boolean;
				currency: string;
				programId: string;
				wallet: any;
				authCode: string;
				updated: Date | string;
				created: Date | string;
				id: string;
				datetime: Date | string;
				card: {
					id: string;
					firstNumbers: string;
					lastNumbers: string;
					scheme: string;
				};
				location: {
					address: string;
					city: string;
					countryCode: string;
					id: string;
					geolocation: any;
					postcode: string;
					state: string;
					timezone: string;
					metadata: any;
				};
				brand: {
					id: string;
					name: string;
					logoURL: string;
					metadata: any;
				};
				identifiers: {
					amexApprovalCode: string;
					mastercardAuthCode: string;
					mastercardRefNumber: string;
					mastercardTransactionSequenceNumber: string;
					MID: string;
					visaAuthCode: string;
				};
			}
			export interface Refund {
				accountId: string;
				auth: boolean;
				amount: number;
				cleared: boolean;
				currency: string;
				programId: string;
				wallet: any;
				authCode: string;
				updated: Date | string;
				created: Date | string;
				id: string;
				datetime: Date | string;
				card: {
					id: string;
					firstNumbers: string;
					lastNumbers: string;
					scheme: string;
				};
				location: {
					address: string;
					city: string;
					countryCode: string;
					id: string;
					geolocation: any;
					postcode: string;
					state: string;
					timezone: string;
					metadata: any;
				};
				brand: {
					id: string;
					name: string;
					logoURL: string;
					metadata: any;
				};
				identifiers: {
					amexApprovalCode: string;
					mastercardAuthCode: string;
					mastercardRefNumber: string;
					mastercardTransactionSequenceNumber: string;
					MID: string;
					visaAuthCode: string;
				};
			}
		}
		export namespace Res {
			export type Auth = true | false;
		}
	}
}
