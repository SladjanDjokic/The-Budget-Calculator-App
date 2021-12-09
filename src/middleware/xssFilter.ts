import xssFilters from 'xss-filters';
import { RsError } from '../utils/errors';
import { StringUtils } from '../utils/utils';

enum filterTypes {
	inSingleQuotedAttr = 'inSingleQuotedAttr',
	inDoubleQuotedAttr = 'inDoubleQuotedAttr',
	inUnQuotedAttr = 'inUnQuotedAttr'
}

function checkRequest(req): boolean {
	return true;

	// let body = getBody(req);
	// if (!body || objUtils.isEmpty(body)) return true;
	// for (let i in body) {
	// 	console.log(xssFilters.inSingleQuotedAttr(body[i]));
	// 	let filter = getFilterType(body[i]);
	// 	if (!filter) continue;
	// 	body[i] = xssFilters[filter](body[i]);
	// }
	// return true;
}

let getBody = (req) => {
	let body = '';
	if (req.method == 'GET') {
		body = 'query';
	} else if (req.method == 'POST') {
		body = 'body';
	}
	return req[body];
};

let getFilterType: any = (value: any) => {
	if (!value) return;
	if (StringUtils.testRegex(/^\'.*$/gm, value)) return filterTypes.inSingleQuotedAttr; //matches single quote
	if (StringUtils.testRegex(/^\".*$/gm, value)) return filterTypes.inDoubleQuotedAttr; //matches double quote
	if (StringUtils.testRegex(/^((?!\'|\").)*$/gm, value)) return filterTypes.inUnQuotedAttr; // matches unquoted
	return filterTypes.inUnQuotedAttr; // default to unquoted filter
};

export default async (req, res, next) => {
	if (checkRequest(req) == false) {
		throw new RsError('FORBIDDEN', 'XSS: req.query forbidden');
	} else {
		next();
	}
};
