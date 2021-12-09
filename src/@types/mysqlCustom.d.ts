import { Pool, PoolConnection, MysqlError } from 'mysql';

export interface CustomPool extends Pool {
	runQuery(query: string, options?: object | Array<any>);
	queryOne(query: string, options?: object | Array<any>);
	beginTransaction();
	getConnection(callback: (err: MysqlError, connection: CustomPoolConnection) => void): void;
}

export interface CustomPoolConnection extends PoolConnection {
	runQuery(query: string, options?: object | Array<any>);
	queryOne(query: string, options?: object | Array<any>);
}
