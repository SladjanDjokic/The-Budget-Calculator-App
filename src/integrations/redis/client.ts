import config from '../../utils/config';
import redis from 'redis';
import redisAdapter from 'socket.io-redis';
import { IRedisClient } from './IRedisClient';

class Redis implements IRedisClient {
	subscriber = redis.createClient(config.redis.port, config.redis.host, { auth_pass: config.redis.password });
	publisher = redis.createClient(config.redis.port, config.redis.host, { auth_pass: config.redis.password });
	constructor() {
		process.on('SIGINT', () => {
			setTimeout(() => {
				console.log('close redis');
				this.publisher.end(true);
				this.subscriber.end(true);
			}, 9000);
		});
	}
	init(io) {
		io.adapter(redisAdapter({ pubClient: this.publisher, subClient: this.subscriber }));
	}

	set(key: string, value: any): Promise<void> {
		key = this.prefixWithEnvironment(key);

		return new Promise<void>((resolve, reject) => {
			let newValue = '';
			try {
				newValue = JSON.stringify(value);
			} catch (e) {
				newValue = value;
			}
			this.publisher.set(key, newValue, (err, data) => {
				if (err) reject(err);
				resolve();
			});
		});
	}

	get(key: string, prefix: boolean = true): Promise<any> {
		if (prefix) key = this.prefixWithEnvironment(key);

		return new Promise((resolve, reject) => {
			this.publisher.get(key, (err, data) => {
				if (err) resolve(null);
				let newValue: any;
				try {
					newValue = JSON.parse(data);
				} catch (e) {
					newValue = data;
				}
				resolve(newValue);
			});
		});
	}

	getList(key: string, prefix: boolean = true): Promise<string[] | null> {
		if (prefix) key = this.prefixWithEnvironment(key);

		return new Promise((resolve, reject) => {
			this.publisher.lrange(key, 0, -1, (err, data) => {
				if (err) resolve(null);

				resolve(data);
			});
		});
	}

	getMany(keys: string[], prefix: boolean = true): Promise<string[]> {
		if (prefix) {
			keys = keys.map(this.prefixWithEnvironment);
		}
		return new Promise((resolve, reject) => {
			this.publisher.mget(keys, (err, data) => {
				if (err) resolve(null);
				let newValues: string[] = [];
				try {
					for (let value of data) {
						newValues.push(JSON.parse(value));
					}
				} catch (e) {
					newValues = data;
				}
				resolve(newValues);
			});
		});
	}

	lpush(key: string, value: any): Promise<void> {
		key = this.prefixWithEnvironment(key);
		if (!(value instanceof Array)) value = [value];

		return new Promise<void>((resolve, reject) => {
			let newValue: string[] = [];
			for (const item of value) {
				try {
					newValue.push(JSON.stringify(item));
				} catch (e) {
					newValue.push(item as string);
				}
			}
			this.publisher.lpush(key, newValue, (err, data) => {
				if (err) reject(err);
				resolve();
			});
		});
	}

	rpush(key: string, value: any): Promise<void> {
		key = this.prefixWithEnvironment(key);
		if (!(value instanceof Array)) value = [value];

		return new Promise<void>((resolve, reject) => {
			let newValue: string[] = [];
			for (const item of value) {
				try {
					newValue.push(JSON.stringify(item));
				} catch (e) {
					newValue.push(item as string);
				}
			}
			this.publisher.rpush(key, newValue, (err, data) => {
				if (err) reject(err);
				resolve();
			});
		});
	}

	lpop(key: string, prefix: boolean = true): Promise<string> {
		if (prefix) key = this.prefixWithEnvironment(key);

		return new Promise<string>((resolve, reject) => {
			this.publisher.lpop(key, (err, data) => {
				if (err) resolve(null);
				let newValue: any;
				try {
					newValue = JSON.parse(data);
				} catch (e) {
					newValue = data;
				}
				resolve(newValue);
			});
		});
	}

	del(key: string, dontPrefix: boolean = false): Promise<number> {
		if (dontPrefix == false) {
			key = this.prefixWithEnvironment(key);
		}

		return new Promise((resolve, reject) => {
			this.publisher.del(key, (err, data) => {
				if (err) resolve(null);
				resolve(data);
			});
		});
	}

	keys(like: string, dontPrefix: boolean = false): Promise<string[]> {
		if (dontPrefix == false) {
			like = this.prefixWithEnvironment(like);
		}

		return new Promise((resolve, reject) => {
			this.publisher.keys(like, (err, data) => {
				if (err) resolve(null);
				resolve(data);
			});
		});
	}

	incr(key: string, prefix: boolean = true) {
		if (prefix) key = this.prefixWithEnvironment(key);
		return new Promise((resolve, reject) => {
			this.publisher.incr(key, (err, data) => {
				if (err) resolve(null);
				resolve(data);
			});
		});
	}

	private prefixWithEnvironment(value: string) {
		if (config.isProduction) return value;

		return 'sand_' + value;
	}
}

let redisClient = new Redis();
export default redisClient;
