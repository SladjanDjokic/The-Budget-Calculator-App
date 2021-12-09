/* Note: We tried our best to find matching HTML codes for some of the things
   we are doing. However there isn't a perfect match because the HTML status
   codes were meant as a server signaling a client about some error either in the request
   and not the necessarily that a credit card was declined for example.
 */
import html = Mocha.reporters.html;

export enum htmlStatusCodes {
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	METHOD_NOT_ALLOWED = 405,
	ALREADY_EXISTS = 409,
	CONFLICT = 409,
	VERSION_OUT_OF_DATE = 418, // Technically this is the I'm a teapot code that was a joke.
	SERVER_ERROR = 500,
	SERVICE_UNAVAILABLE = 503,
	NETWORK_CONNECT_TIMEOUT = 599
}

export type ErrorCode =
	| 'UNKNOWN_ERROR'
	| 'NOT_FOUND'
	| 'EMAIL_TAKEN'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'CONFLICT'
	| 'UPDATE_FORBIDDEN'
	| 'CREATE_FORBIDDEN'
	| 'DELETE_FORBIDDEN'
	| 'BAD_REQUEST'
	| 'INVALID_TOKEN'
	| 'INCORRECT_EMAIL_OR_PASSWORD'
	| 'DUPLICATE_TOKEN'
	| 'DUPLICATE_USERNAME'
	| 'DUPLICATE_EMAIL'
	| 'DUPLICATE'
	| 'EMAIL_NOT_VERIFIED'
	| 'UPDATE_WITHOUT_ID'
	| 'CONNECTION_ERROR'
	| 'INVALID_PAYMENT'
	| 'DECLINED_PAYMENT'
	| 'INTEGRATION_ERROR'
	| 'CANNOT_RESERVE'
	| 'REFUND_FAILURE'
	| 'INVALID_INVOICE'
	| 'INVALID_COUPON'
	| 'SERVICE_UNAVAILABLE'
	| 'METHOD_UNALLOWED'
	| 'LOGIN_EXPIRED';

export class RsError {
	err: ErrorCode;
	msg: string;
	status?: number;
	stack: string;

	constructor(errCode: ErrorCode, message?: string) {
		this.err = errCode;
		this.msg = message;
		this.status = RsError.htmlStatus(errCode);
		this.stack = new Error().stack;
	}

	static htmlStatus(code: ErrorCode): number {
		return htmlStatusMap[code];
	}
}

// MAKE SURE TO ADD A NEW ERROR TO BOTH THE LIST AND AN APPROPRIATE HTML CODE
// -- otherwise we default to error 500 --
// export function

let htmlStatusMap: { [key in ErrorCode]: number } = {
	UNKNOWN_ERROR: htmlStatusCodes.SERVER_ERROR,
	NOT_FOUND: htmlStatusCodes.NOT_FOUND,
	EMAIL_TAKEN: htmlStatusCodes.CONFLICT,
	FORBIDDEN: htmlStatusCodes.FORBIDDEN,
	CONFLICT: htmlStatusCodes.CONFLICT,
	UNAUTHORIZED: htmlStatusCodes.UNAUTHORIZED,
	UPDATE_FORBIDDEN: htmlStatusCodes.FORBIDDEN,
	CREATE_FORBIDDEN: htmlStatusCodes.FORBIDDEN,
	DELETE_FORBIDDEN: htmlStatusCodes.FORBIDDEN,
	BAD_REQUEST: htmlStatusCodes.BAD_REQUEST,
	INVALID_TOKEN: htmlStatusCodes.UNAUTHORIZED,
	INCORRECT_EMAIL_OR_PASSWORD: htmlStatusCodes.UNAUTHORIZED,
	DUPLICATE_TOKEN: htmlStatusCodes.CONFLICT,
	DUPLICATE_USERNAME: htmlStatusCodes.CONFLICT,
	DUPLICATE_EMAIL: htmlStatusCodes.CONFLICT,
	DUPLICATE: htmlStatusCodes.CONFLICT,
	EMAIL_NOT_VERIFIED: htmlStatusCodes.BAD_REQUEST,
	UPDATE_WITHOUT_ID: htmlStatusCodes.BAD_REQUEST,
	CONNECTION_ERROR: htmlStatusCodes.NETWORK_CONNECT_TIMEOUT,
	INVALID_PAYMENT: htmlStatusCodes.FORBIDDEN,
	DECLINED_PAYMENT: htmlStatusCodes.FORBIDDEN,
	INTEGRATION_ERROR: htmlStatusCodes.SERVER_ERROR,
	CANNOT_RESERVE: htmlStatusCodes.FORBIDDEN,
	REFUND_FAILURE: htmlStatusCodes.FORBIDDEN,
	INVALID_INVOICE: htmlStatusCodes.FORBIDDEN,
	INVALID_COUPON: htmlStatusCodes.FORBIDDEN,
	SERVICE_UNAVAILABLE: htmlStatusCodes.SERVICE_UNAVAILABLE,
	METHOD_UNALLOWED: htmlStatusCodes.METHOD_NOT_ALLOWED,
	LOGIN_EXPIRED: htmlStatusCodes.UNAUTHORIZED
};
