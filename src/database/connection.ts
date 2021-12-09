import mysql, { ConnectionConfig } from 'mysql';
import mysqlUtilities from 'mysql-utilities';
import config from '../utils/config';
import { CustomPool } from '../@types/mysqlCustom';

const connection = (env: string) => {
	let auth = config.database as ConnectionConfig;
	auth.typeCast = function (field, next) {
		function jsonEscape(str: string) {
			if (!!!str?.length) return str;
			return str.replace(/\r?\n|\t|\r/g, ' ');
		}
		if (field.type == 'BLOB' || field.type == 'MEDIUM_BLOB' || field.type === 'LONG_BLOB') {
			let value = jsonEscape(field.string());
			try {
				return JSON.parse(value);
			} catch (e) {
				return value;
			}
		}
		return next();
	};

	let pool = mysql.createPool(auth);
	mysqlUtilities.upgrade(pool);
	mysqlUtilities.introspection(pool);
	return pool as CustomPool;
};

export default (env?: string) => {
	return connection(env);
};
