import { IRedisClient } from './IRedisClient';
import anymatch from 'anymatch';
import { DateUtils } from '../../utils/utils';

export default class RedisClientMock implements IRedisClient {
	values: {} = {};
	public getCalls = 0;
	public getManyCalls = 0;

	async get(key: string, prefix: boolean = false) {
		this.getCalls++;
		try {
			return JSON.parse(this.values[key]);
		} catch {
			return this.values[key];
		}
	}
	async getList(key: string): Promise<string[]> {
		try {
			return (this.values[key] as Array<string>).map((val) => JSON.parse(val));
		} catch {
			return this.values[key];
		}
	}
	async lpop(key: string) {
		return (this.values[key] as Array<string>)?.pop();
	}
	async getMany(keys: string[], prefix: boolean = false): Promise<string[]> {
		this.getManyCalls++;
		const valuePairs = Object.entries(this.values).filter((v) => keys.includes(v[0]));
		try {
			const selectedValues = valuePairs.map(function (v) {
				try {
					return JSON.parse(v[1] as string);
				} catch {
					return v[1];
				}
			});
			return selectedValues;
		} catch {
			return valuePairs.map((p) => p[1] as string);
		}
	}
	async set(key: string, value: any) {
		try {
			this.values[key] = JSON.stringify(value);
		} catch {
			this.values[key] = value;
		}
	}
	async lpush(key: string, value: any) {
		if (!this.values[key]) this.values[key] = [];
		try {
			this.values[key].unshift(JSON.stringify(value));
		} catch {
			this.values[key].unshift(value);
		}
	}
	async rpush(key: string, value: any) {
		if (!this.values[key]) this.values[key] = [];
		try {
			this.values[key].push(JSON.stringify(value));
		} catch {
			this.values[key].push(value);
		}
	}
	async keys(like: string): Promise<string[]> {
		return Object.keys(this.values).filter((v) => anymatch(like, v));
	}
	async del(key: string): Promise<number> {
		delete this.values[key];
		return 1;
	}
	reset() {
		this.values = {};
		this.getCalls = 0;
		this.getManyCalls = 0;
	}
}
