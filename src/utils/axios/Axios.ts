import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import logger from '../logger';
import { RsError } from '../errors';
const parseXml = require('xml2js').parseString;

export interface AxiosInterface {
	get(url: string): Promise<any>;
	deleteRequest(url: string): Promise<any>;
	post(url: string, data: any): Promise<any>;
	put(url: string, data: any): Promise<any>;
	patch(url: string, data: any): Promise<any>;
}

export default class Axios {
	constructor() {}

	async get(url: string, config: AxiosRequestConfig) {
		let result: AxiosResponse;
		try {
			result = await axios.get(url, config);
		} catch (e) {
			result = e.response;
		}
		return this.handleResponse(result);
	}

	async deleteRequest(url: string, config: AxiosRequestConfig) {
		let result: AxiosResponse;
		try {
			result = await axios.delete(url, config);
		} catch (e) {
			result = e.response;
		}
		return this.handleResponse(result);
	}

	async post(url: string, data: any, config: AxiosRequestConfig) {
		let result: AxiosResponse;
		try {
			result = await axios.post(url, data, config);
		} catch (e) {
			result = e.response;
		}
		return this.handleResponse(result);
	}

	async put(url: string, data: any, config: AxiosRequestConfig) {
		let result: AxiosResponse;
		try {
			result = await axios.put(url, data, config);
		} catch (e) {
			result = e.response;
		}
		return this.handleResponse(result);
	}

	async patch(url: string, data: any, config: AxiosRequestConfig) {
		let result: AxiosResponse;
		try {
			result = await axios.patch(url, data, config);
		} catch (e) {
			result = e.response;
		}
		return this.handleResponse(result);
	}

	private handleResponse(result: AxiosResponse) {
		if (!result || result.status === 500) {
			try {
				logger.error(JSON.stringify(result));
			} catch {
				logger.error(JSON.stringify(result.data));
			}
			throw new RsError('BAD_REQUEST');
		}
		if (result.status >= 400 && result.status <= 499) {
			logger.error(result.status);
			logger.error(JSON.stringify(result.data));
			throw new RsError('BAD_REQUEST', JSON.stringify(result.data));
		}
		if (result.status >= 200 && result.status <= 399) {
			if (result.data?.ErrorCode) {
				throw new RsError('BAD_REQUEST', result.data);
			}
			return result.data;
		}
	}
}
