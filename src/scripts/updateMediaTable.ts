import mysql from 'mysql';
import config from '../utils/config';
import path from 'path';
import { RsError } from '../utils/errors';
const productionDb = {
	host: 'database-1.ckq28joypdqw.us-east-2.rds.amazonaws.com',
	port: 3306,
	user: 'admin',
	password: '8BxJnACz3XVnEJLXF8',
	database: 'spire',
	timezone: 'UTC',
	multipleStatements: true,
	charset: 'utf8mb4'
};
const sandboxDb = {
	host: '3.136.130.47',
	port: 3306,
	user: 'dev',
	password: '76CC*!gjCRp2eX>Y*fRR',
	database: 'ndm_sandbox'
};

const rsDatabase = mysql.createPool(productionDb);
const db = dbPromises(rsDatabase);
// const id = 3227;

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
	let res = await db.runQuery(`select id, urls from media;`, []);

	let updatedMediaUrls: { id; urls }[] = res.result.map((item) => {
		let parseUrl = JSON.parse(item.urls);
		if (!parseUrl || !Object.keys(parseUrl).length) return false;
		const imageName = getFileName(parseUrl.large);
		if (!imageName)
			throw new RsError('BAD_REQUEST', `No image name found - ${item.id}-${JSON.stringify(parseUrl)}`);
		return {
			id: item.id,
			urls: {
				...parseUrl,
				imageKit: `https://ik.imagekit.io/redsky/spire/${imageName}`
			}
		};
	});

	updatedMediaUrls.forEach(async (urlObject, index) => {
		console.log(`Updating: ${index + 1} of ${updatedMediaUrls.length}`);
		try {
			await db.runQuery(`update media set urls = ? where id = ?`, [JSON.stringify(urlObject.urls), urlObject.id]);
			console.log('Success Updating: ', urlObject.id);
		} catch (e) {
			console.error(e);
		}
	});
	process.exit(0);
}

function getFileName(filePath: string): string {
	const { ext, name } = path.parse(filePath);
	return name + ext;
}

test();
