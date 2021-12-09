export interface IRedisClient {
	get: (key: string, prefix?: boolean) => Promise<any>;
	getList: (key: string, prefix?: boolean) => Promise<string[] | null>;
	getMany: (keys: string[], prefix?: boolean) => Promise<string[]>;
	set: (key: string, value: any) => Promise<void>;
	rpush: (key: string, value: any) => Promise<void>;
	lpush: (key: string, value: any) => Promise<void>;
	lpop: (key: string, prefix?: boolean) => Promise<string>;
	keys: (like: string, dontPrefix?: boolean) => Promise<string[]>;
	del: (key: string, dontPrefix?: boolean) => Promise<number>;
}
