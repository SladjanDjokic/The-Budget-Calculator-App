import responseTime from 'response-time';
import { RsRequest, RsResponse } from '../@types/expressCustom';
import logger from './logger';

export default function () {
	return responseTime(function (req: RsRequest<any>, res: RsResponse<any>, time: number) {
		let companyId = req.companyId || -1;
		let userId = req.user ? req.user.id : -1;

		let logConsoleMessage = `[${companyId}:${userId}] ${req.method} (${res.statusCode}) : ${
			req.path
		} - ${time.toFixed(3)}`;
		let logMetaData = {
			duration: time * 1e6,
			'http.method': req.method,
			'http.url_details.path': req.path,
			'http.status_code': res.statusCode,
			'network.client.ip': req.headers['x-forwarded-for'] || req.connection.remoteAddress,
			'company.id': companyId,
			'user.id': userId
		};

		if (res.statusCode < 400) {
			logger.info(logConsoleMessage, logMetaData);
		} else if (res.statusCode >= 400 && res.statusCode < 500) {
			logger.warn(logConsoleMessage, logMetaData);
		} else {
			logger.error(logConsoleMessage, logMetaData);
		}
	});
}
