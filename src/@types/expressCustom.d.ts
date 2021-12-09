import * as express from 'express';
import { htmlStatusCodes, ErrorCode } from '../utils/errors';
import { UserAgent } from 'express-useragent';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';

export interface RsRequest<T> extends express.Request {
	user: any;
	companyId?: number;
	data?: T;
	file?: any;
	useragent: UserAgent;
	internalResource: Model.InternalResourceTypes;
	roles: Model.UserRole[];
	isSelf?: boolean;
}

export interface RsResponse<T> extends express.Response {
	sendData: (data: T, statusCode?: number) => void;
	sendPaginated: (data: T, total: number, statusCode?: number) => void;
	sendError: (err: ErrorCode, msg: string, htmlStatusCode?: htmlStatusCodes, stack?) => void;
	sendLogger?: (data: Object) => void;
}
