import redisClient from '../integrations/redis/client';
import config from '../utils/config';
import logger from '../utils/logger';

(async function () {
	const prefixForSand = config.isProduction ? false : true;
	let keys: string[] = (await redisClient.keys('*-roles', prefixForSand)) as string[];
	logger.info(`Flushing company roles for: `, config.isProduction ? 'Prod' : 'Sand');
	for (let key of keys) {
		await redisClient.del(key, true);
	}
	logger.info(`Flushed company - count: `, keys.length);
	process.exit(0);
})();
