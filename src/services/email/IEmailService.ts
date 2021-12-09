import IService from '../IService';

export enum EmailType {
	WELCOME = 'WELCOME',
	RESET_PASSWORD = 'RESET_PASSWORD',
	SIGN_UP = 'SIGN_UP',
	BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
	AP_LOGIN_2FA = 'AP_LOGIN_2FA',
	BOOKING_CANCELLATION = 'BOOKING_CANCELLATION',
	ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
	VOUCHER_ORDER_CONFIRMATION = 'VOUCHER_ORDER_CONFIRMATION',
	BOOKING_MODIFICATION = 'BOOKING_MODIFICATION',
	REVIEW_CREATE = 'REVIEW_CREATE'
}

export enum EmailReplyType {
	DEFAULT = 'DEFAULT',
	RESERVATION = 'RESERVATION',
	SUPPORT = 'SUPPORT'
}

export type EmailMetaData = { [key: string]: string };

// Email send object is pretty flexible. You have multiple options such as:
// - Specify a receiptId or receiptEmail to send to
// - Specify an initiator or not
// - Specify a reply type or not
export interface EmailSendImmediate {
	templateType?: EmailType;
	initiatorId?: number;
	recipientId?: number;
	recipientEmail?: string;
	emailReplyType?: EmailReplyType;
	metaData?: EmailMetaData;
}

export interface EmailSendDelayed extends EmailSendImmediate {
	sendOn: Date;
}

export interface AgendaEmailData extends Omit<Model.EmailLog, 'id' | 'sentOn' | 'companyId'> {}

export default interface IEmailService extends IService {
	sendImmediate: (emailData: EmailSendImmediate) => Promise<void>;
	sendDelayed: (emailData: EmailSendDelayed) => Promise<void>;
}
