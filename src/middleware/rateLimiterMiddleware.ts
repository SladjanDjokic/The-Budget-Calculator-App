import { RateLimiterRedis } from 'rate-limiter-flexible';
import * as slack from '../integrations/slack/slack';
import config from '../utils/config';

// const redisClient = redis.createClient({
//   host: config.redis.host,
//   port: config.redis.port,
//   auth_pass: config.redis.password,
//   enable_offline_queue: false
// });

const rateLimiter = new RateLimiterRedis({
	storeClient: 'redis',
	// redis: redisClient,
	keyPrefix: 'ratelimiter',
	points: config.rateLimiter.points,
	duration: config.rateLimiter.duration,
	blockDuration: config.rateLimiter.blockDuration
});

export default (req, res, next) => {
	if (['/admin', '/static/', '/api-docs'].some((skipPath) => req.path.indexOf(skipPath) > -1)) return next();
	rateLimiter
		.consume(req.ip)
		.then(() => {
			next();
		})
		.catch(() => {
			slack.send(`${req.ip} has been blocked by the rate limiter.`, slack.SEVERITY_CODES.critical);
			res.status(429).send('Too Many Requests');
		});
};
