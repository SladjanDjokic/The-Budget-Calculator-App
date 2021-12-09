import { RsError } from '../utils/errors';
import config from '../utils/config';
import serviceFactory from '../services/serviceFactory';
import UserService from '../services/user/user.service';
import errorHandler from './errorHandler';
import logger from '../utils/logger';
import { RsRequest, RsResponse } from '../@types/expressCustom';
import * as express from 'express';
import { publicEndpoints } from '../@decorators/publicUrl';

const sendStackTrace = !config.isProduction;

export async function authenticate(req, res, next) {
	try {
		if (config.underMaintenance) {
			return res.status(503).send({ data: { message: 'we will be back shortly' } });
		}

		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Headers', '*');
		res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');

		addResponseFunctions(res);

		if (req.method === 'OPTIONS') {
			return next();
		}
		let body = getBody(req);
		let token = getToken(req);

		if (token) {
			const result = await authWithToken(body, token, req, res, next);
			// For admin portal requests
			if (req.headers['admin-portal'] === 'true') {
				logger.info('Did we forget to limit user access on something?');
			}
			return result;
		} else if (isPublicRequest(req)) {
			return next();
		}
		throw new RsError('INVALID_TOKEN', 'Invalid Token');
	} catch (e) {
		errorHandler(e, req, res, next);
	}
}

let addResponseFunctions = (res) => {
	res.sendData = function (data, statusCode = 200) {
		if (res.sendLogger) {
			try {
				res.sendLogger(data);
			} catch (e) {}
		}
		res.status(statusCode).send({ data });
	};

	res.sendPaginated = function (data, total: number, statusCode = 200) {
		if (res.sendLogger) {
			try {
				res.sendLogger(data);
			} catch (e) {}
		}
		res.status(statusCode).send({ data, total });
	};

	res.sendPaginated = function (data, total: number, statusCode = 200) {
		if (res.sendLogger) {
			try {
				res.sendLogger(data);
			} catch (e) {}
		}
		res.status(statusCode).send({ data, total });
	};

	/**
	 * Sends an error with just { err, msg }
	 */
	res.sendError = function (err, msg, htmlStatusCode, stack) {
		let errorData = { err, msg };
		if (htmlStatusCode === undefined) {
			if (RsError.htmlStatus[err] !== undefined) {
				htmlStatusCode = RsError.htmlStatus[err];
			} else {
				htmlStatusCode = 500;
			}
		}
		if (sendStackTrace && stack) errorData['stack'] = stack;
		if (res.sendLogger) res.sendLogger(errorData);
		res.status(htmlStatusCode).send(errorData);
	};
};

function getBody(req: express.Request): any {
	let body;
	if (req.method === 'GET' || req.method === 'DELETE') {
		body = 'query';
	} else {
		body = 'body';
	}

	return req[body];
}

function getToken(req: express.Request): string | null {
	// Token ideally comes in from the headers, however we will allow via URL...mostly for testing
	if (req.headers.token) return req.headers.token as string;
	if (req.method === 'GET' && req.query['token']) return req.query.token as string;
	return null;
}

export function isPublicRequest(req: RsRequest<any>): boolean {
	const requestUrl = getRequestingUrl(req.originalUrl);
	for (let i in publicEndpoints[req.method]) {
		if (requestUrl === publicEndpoints[req.method][i]) return true;
	}
	return false;
}

async function authWithToken(body: any, token: string | null, req: RsRequest<any>, res: RsResponse<any>, next) {
	const userService = serviceFactory.get<UserService>('UserService');
	try {
		let checkLoginExpiration = req.headers['admin-portal'] ? true : false;
		req.user = await userService.authToken(token, checkLoginExpiration);
		if (checkLoginExpiration && req.companyId === undefined) req.companyId = req.user.companyId;
		return next();
	} catch (e) {
		if (isPublicRequest(req)) {
			req.user = {} as Model.User;
			return next();
		} else {
			if (e.err === 'LOGIN_EXPIRED') throw e;
			throw new RsError('INVALID_TOKEN', e.message);
		}
	}
}

function getRequestingUrl(url: string) {
	let urlPath;
	try {
		urlPath = url.split('?')[0];
	} catch (e) {
		urlPath = url;
	}
	return urlPath.replace('/api/v1/', '');
}

// let hasExternalAccess = async req => {
//     const externalAccessService: ExternalAccessService = serviceFactory.get('ExternalAccessService');
//     const externalAccount = await externalAccessService.isValidExternalRequest(req);
//     if (!externalAccount) return false;
//     req.externalAccount = externalAccount;
//     return true;
// };
