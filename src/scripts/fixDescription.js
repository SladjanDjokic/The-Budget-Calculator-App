const mysql = require('mysql');
const rsDatabase = mysql.createPool({
	host: '3.136.130.47',
	port: 3306,
	user: 'dev',
	password: '76CC*!gjCRp2eX>Y*fRR',
	database: 'ndm_sandbox'
});
const db = dbPromises(rsDatabase);

function dbPromises(connection) {
	connection.runQuery = async (query, options) => {
		return new Promise((resolve, reject) => {
			try {
				let queryObj = connection.query(query, options || [], (err, rows) => {
					if (err) {
						console.error(err);
						console.error(queryObj.sql);
						resolve({ error: err, queryObj });
						return;
					}
					resolve({ result: rows });
				});
			} catch (e) {
				reject(e);
			}
		});
	};
	return connection;
}

async function test() {
	let res = await db.runQuery(`select id, longDescription from accommodation`, []);

	let newData = res.result.map((item, index) => {
		if (item.longDescription === '' || item.longDescription === null) return { ...item, longDescription: '' };
		else
			return {
				...item,
				longDescription: item.longDescription
					.replace(/\r?\n|\t|\r/g, ' ')
					.match(/[^ ]+/g)
					.join(' ')
			};
	});

	newData.forEach(async (item) => {
		await db.runQuery(`update accommodation set longDescription = ? where id = ?`, [item.longDescription, item.id]);
	});
}

test();
