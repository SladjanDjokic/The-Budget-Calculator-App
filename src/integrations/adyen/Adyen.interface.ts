export namespace IAdyen {
	export interface ServiceDetails {
		apiKey: string;
		merchantAccount: string;
		environment: 'TEST' | 'LIVE';
		paymentReturnUrl?: string;
	}

	export namespace Model {}

	export namespace Payment {
		export namespace Req {
			export interface PaymentAmount {
				currency: string;
				value: number;
			}

			export interface PaymentMethod {
				countryCode: string;
				shopperLocale: string;
				amount: PaymentAmount;
			}

			export interface CreatePayment extends Omit<Api.Order.Req.CreatePayment, 'referenceId'> {
				reference: string;
				merchantAccount: string;
				returnUrl: string;
				shopperReference?: string;
			}
		}
		export namespace Res {
			export interface CreatePaymentFailure {
				pspReference?: string;
				refusalReason?: string;
				resultCode?:
					| 'Refused'
					| 'Authorised'
					| 'AuthenticationFinished'
					| 'Cancelled'
					| 'ChallengeShopper'
					| 'Error'
					| 'IdentifyShopper'
					| 'Pending'
					| 'PresentToShopper'
					| 'Received'
					| 'RedirectShopper';
				refusalReasonCode?: string;
				merchantReference?: string;
			}
			export interface CreatePayment {
				pspReference: string;
				resultCode:
					| 'Refused'
					| 'Authorised'
					| 'AuthenticationFinished'
					| 'Cancelled'
					| 'ChallengeShopper'
					| 'Error'
					| 'IdentifyShopper'
					| 'Pending'
					| 'PresentToShopper'
					| 'Received'
					| 'RedirectShopper';
				amount: Req.PaymentAmount;
				merchantReference: string;
			}
		}
	}
}
