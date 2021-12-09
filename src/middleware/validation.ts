import validator from 'mysql-validator';

let metaTools = null;
const enums = {}; //require('../enums.json');

const validation = async (req, res, next) => {
	await handleRequest(req, res, next);
};

const handleRequest = async (req, res, next) => {
	console.log(req._parsedUrl.pathname);
	if (req.method == 'GET') {
		return handleGet(req, res, next);
	} else if (req.method == 'POST') {
		return await handleUpdate(req, res, next);
	} else {
		next();
	}
};

const handleUpdate = async (req, res, next) => {
	let table_name = getTableName(req);
	let meta = await metaTools.getMetadata(table_name);
	let invalid_columns = [];
	for (let i in meta) {
		if (i.indexOf('__') > -1) continue;
		if (isEmptyString(req.body, i)) req.body[i] = null;
		if (isEmpty(req.body, i)) continue;
		if (isEnum(req.body, i, table_name) && isEnumValid(req.body, i, table_name)) continue;
		let valid = isValid(req.body[i], meta[i].db_type);
		if (!valid) {
			invalid_columns.push({ key: i, value: req.body[i] });
		}
	}
	if (invalid_columns.length > 0) {
		res.status(400).send({
			err: invalid_columns,
			message: 'The body of this request is not valid'
		});
		return;
	}
	next();
};

const isEnum = (body, column, table) => {
	if (!enums[table]) return false;
	if (!enums[table][column]) return false;
	// if(enums[table][column][body[column]]) return true;
	return false;
};

const isEnumValid = (body, column, table) => {
	if (!enums[table]) return false;
	if (!enums[table][column]) return false;
	if (enums[table][column][body[column]]) return true;
	return false;
};

const handleGet = (req, res, next) => {
	next();
};

const getTableName = (req) => {
	return req._parsedUrl.pathname.split('/')[3];
};

const isValid = (value, type) => {
	return !validator.check(value, type);
};

const isEmpty = (obj, property) => {
	if (!obj) return true;
	if (obj[property] === null || obj[property] === undefined) {
		return true;
	}
	if (obj[property] !== null && obj[property] !== undefined) return false;
	return false;
};

const isEmptyString = (obj, property) => {
	if (!obj) return true;
	if (obj && obj[property] === '') return true;
	return false;
};

export default (meta) => {
	metaTools = meta;
	return validation;
};
