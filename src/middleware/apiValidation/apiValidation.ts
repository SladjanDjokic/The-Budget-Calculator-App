// RESOURCE - https://github.com/joanllenas/ts.data.json
import logger from '../../utils/logger';
import { ObjectUtils, StringUtils } from '../../utils/utils';
import validationFactory from './ValidationFactory';
import { ApiMethod, RsRequest, RsResponse } from '../../@types/expressCustom';

async function endpointValidation(req: RsRequest<any>, res: RsResponse<any>, next) {
	const apiMethod = req.method as ApiMethod;
	if (apiMethod === 'OPTIONS') return next();
	const baseUrl = req.url.split('?')[0]; // see if req.path
	const endpointClassName = StringUtils.capitalizeFirst(req?.url.split('/')[2]);
	let endpointMethod = baseUrl.split('/').slice(3).join('/');
	while (endpointMethod.endsWith('/')) {
		endpointMethod = endpointMethod.substr(0, endpointMethod.length - 1);
	}
	req.data = getData(req);
	const classValidationMethod = validationFactory.get(apiMethod, `${endpointClassName}Validation`, endpointMethod);
	if (!classValidationMethod) {
		logger.warn(`No validation for endpoint: ${apiMethod}:${baseUrl}`);
		return next();
	}
	classValidationMethod
		//@ts-ignore
		.decodePromise(req.data)
		.then(() => {
			next();
		})
		.catch((error) => {
			logger.error(error);
			return res.sendError('BAD_REQUEST', error, 400);
		});
}

function getData(req: RsRequest<any>) {
	let body = '';
	if (req.method == 'GET' || req.method === 'DELETE') {
		body = 'query';
		for (let attr in req[body]) {
			if (req[body][attr] instanceof Array) {
				let attrList = [];
				for (let value of req[body][attr]) {
					if (isNaN(Number(value))) continue;
					attrList.push(Number(value));
				}
				if (ObjectUtils.isArrayWithData(attrList)) req[body][attr] = attrList;
			} else {
				req[body][attr] = ObjectUtils.smartParse(req[body][attr]);
				if (isNaN(Number(req[body][attr]))) continue;
				req[body][attr] = Number(req[body][attr]);
			}
		}
	} else {
		body = 'body';
	}
	return req[body];
}

export default endpointValidation;
