import util from 'util';
import { RsError } from '../utils/errors';
import { CustomPool } from '../@types/mysqlCustom';

export default (pool: CustomPool) => {
	pool.runQuery = async (query, options) => {
		return new Promise((resolve, reject) => {
			let queryObj = pool.query(query, options || [], (err, result, fields) => {
				if (err) {
					console.error(err);
					console.error(queryObj.sql);
					reject({ err, queryObj });
					return;
				}
				resolve(result);
			});
		});
	};

	pool.queryOne = async (query, options) => {
		let rows = await pool.runQuery(query, options || []);
		if (rows && rows.hasOwnProperty('length') && rows.length == 0) {
			throw new RsError('NOT_FOUND', 'Not Found');
		} else if (rows && rows.hasOwnProperty('length') && rows.length > 1) {
			console.log(query, options, rows);
			throw new RsError('DUPLICATE', 'Duplicate');
		}
		return rows[0];
	};

	pool.beginTransaction = async () => {
		return new Promise((resolve, reject) => {
			pool.getConnection((err, connection) => {
				connection.beginTransaction((err) => {
					if (err) {
						reject(err);
					} else {
						connection.rollback = util.promisify(connection.rollback);
						connection.runQuery = async (query, options) => {
							return new Promise((resolve, reject) => {
								let queryObj = connection.query(query, options || [], async (err, results) => {
									if (err) {
										console.error(err);
										console.error(queryObj.sql);
										if (err.code == 'ER_LOCK_DEADLOCK' || err.code == 'ER_LOCK_WAIT_TIMEOUT') {
											console.log(err, 'DEADLOCK');
											await connection.rollback();
										} else {
											await connection.rollback();
										}
										reject({ err, queryObj });
										return;
									}
									resolve(results);
								});
							});
						};
						connection.queryOne = async (query, options) => {
							let rows = await connection.runQuery(query, options || []);
							if (rows && rows.hasOwnProperty('length') && rows.length == 0) {
								throw new RsError('NOT_FOUND', 'Not Found');
							} else if (rows && rows.hasOwnProperty('length') && rows.length > 1) {
								console.log(query, options, rows);
								throw new RsError('DUPLICATE', 'Duplicate');
							}
							return rows[0];
						};
						resolve(connection);
					}
				});
			});
		});
	};
	return pool;
};
