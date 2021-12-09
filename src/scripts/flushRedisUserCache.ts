import redisClient from '../integrations/redis/client';

(async () => {
	let keys: string[] = (await redisClient.keys('sand_user_*', true)) as string[];
	console.log('Flushing sandbox users, count: ', keys.length);
	for (let key of keys) {
		await redisClient.del(key, true);
	}

	keys = (await redisClient.keys('user_*', true)) as string[];
	console.log('Flushing production users, count: ', keys.length);
	for (let key of keys) {
		await redisClient.del(key, true);
	}
	console.log('All keys flushed');
	process.exit(0);
})();
