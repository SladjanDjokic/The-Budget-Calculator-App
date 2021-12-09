import {
	StringUtils as BaseStringUtils,
	ObjectUtils as BaseObjectUtils,
	RegionUtils,
	WebUtils as BaseWebUtils,
	DateUtils as BaseDateUtils
} from '@bit/redsky.framework.rs.utils';
import config from '../utils/config';
import { IRedisClient } from '../integrations/redis/IRedisClient';
import { RsError } from './errors';
import { IncomingHttpHeaders } from 'http';
import { RsRequest } from '../@types/expressCustom';

// Extend the Redsky Utilities Here for REST-specific functions
// Periodically evaluate if these should be MOVED into the redsky.framework

class WebUtils extends BaseWebUtils {
	wrapAsync(fn) {
		return (req, res, next) => {
			// Make sure to `.catch()` any errors and pass them along to the `next()`
			// middleware in the chain, in this case the error handler.
			fn(req, res, next).catch(next);
		};
	}

	/**
	 * Strips off all subdomains and returns just the base domain
	 * @name getDomain
	 * @param {string} url - A url to parse such as truvision.ontrac.io
	 * @returns {string} - The stripped domain such as "ontrac.io"
	 */
	static getDomain(url: string): string {
		if (!url) return '';
		// The Node URL class doesn't consider it a valid url without http or https. Add if needed
		if (url.indexOf('http') === -1) url = 'http://' + url;
		let hostname = new URL(url).hostname;
		// Remove all subdomains
		let hostnameSplit = hostname.split('.').slice(-2);
		return hostnameSplit.join('.');
	}

	static getCompanyId(req: RsRequest<any>): number | undefined {
		return req.headers['admin-portal'] ? req.user?.companyId : req.companyId;
	}

	/**
	 * Async sleep method for waiting for a timeout period
	 * @name sleep
	 * @param {number} ms - sleep time in milliseconds
	 * @returns {Promise}
	 * */
	static async sleep(ms: number) {
		await new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Returns the first subdomain of the url. example https://truvision.ontrac.io -> truvision
	 * @param url
	 * @returns First subdomain or an empty string
	 */
	static getFirstSubdomain(url: string): string {
		if (!url) return '';
		let hostname = this.getHostname(url);

		let hostnameSplit = hostname.split('.');
		if (hostnameSplit.length > 2) return hostnameSplit.splice(-3, 1)[0];
		return '';
	}

	/**
	 * Returns the hostname of the url. example: https://www.youtube.com -> www.youtube.com
	 * @param url Url of address
	 * @returns Hostname of url or empty if url was empty
	 */
	static getHostname(url: string): string {
		if (!url) return '';
		// The Node URL class doesn't consider it a valid url without http or https. Add if needed
		if (!url.startsWith('http')) url = 'http://' + url;
		return new URL(url).hostname;
	}

	/**
	 * Returns the object with a list of fields removed, of a type without those fields
	 * @param arg - an object or array of objects to sanitize
	 * @param remove - an array of property names or indices to remove
	 * @returns {any} - the sanitized object or array
	 */
	static sanitize<T, U extends string | number>(arg: T, remove: U[]): Omit<T, U> {
		const result: any = { ...arg };
		for (let key of remove) {
			delete result[key];
		}
		return result;
	}

	/**
	 * Returns a random number within the range of 0 and your input value
	 * @param {number} value - Max range input
	 * @returns {number} a random number between 0 and your max input value
	 */
	static randomNumberInRange(maxLimit: number): number {
		return Math.floor(Math.random() * Math.floor(maxLimit));
	}
}

class DateUtils extends BaseDateUtils {
	/**
	 * Returns a proper date string from database insertion using now's time stamp
	 * @name dbNow
	 * @returns {string} - Returns a string for datetime insertion into a database
	 */
	static dbNow(): string {
		return BaseDateUtils.clientToServerDateTime(new Date());
	}

	/**
	 * @name displayUserDate
	 * @param string or Date
	 * @returns {string} - Returns a user string representation of the date calculating for timezone offset.
	 */
	static displayUserDate(date: string | Date): string {
		let dateToReturn = new Date(date);
		let timeZoneOffset = dateToReturn.getTimezoneOffset() * 60000;
		dateToReturn.setTime(dateToReturn.getTime() + timeZoneOffset);
		return dateToReturn.toDateString();
	}

	/**
	 * Returns a proper Date string for a given hour offset
	 * @name hoursFromNow
	 * @param {number} hours - The number of hours you want a date Object formatted
	 * @returns {string} - Returns a string for datetime insertion into a database
	 * */
	static hoursFromNow(hours: number): string {
		let today = new Date();
		today.setTime(today.getTime() + hours * (1000 * 60 * 60));
		return BaseDateUtils.clientToServerDateTime(today);
	}

	/**
	 * Returns a proper Date string for a given hour offset
	 * @name minutesFromNow
	 * @param {number} minutes - The number of minutes you want a date Object formatted
	 * @returns {string} - Returns a string for datetime insertion into a database
	 * */
	static minutesFromNow(minutes: number): string {
		let today = new Date();
		today.setTime(today.getTime() + minutes * (1000 * 60));
		return BaseDateUtils.clientToServerDateTime(today);
	}

	/**
	 * Returns the number of days in the given month and year
	 * @param {number} month
	 * @param {number} year
	 * @returns {number} - Returns a number with the total days in the year/month
	 */
	static daysInMonth(month: number, year: number): number {
		return new Date(year, month, 0).getDate();
	}

	/**
	 * Pad a value with a leading zero
	 * @param {string} num
	 * @retuns {string} - Returns a zero padded number
	 */
	static padStart(num: string) {
		if (num.length >= 2) return num;
		return '0' + num.slice(-2);
	}

	/**
	 * Returns a date object with a new range of days
	 * @param {Date} date
	 * @param {number} days
	 * @returns {Date} - Returns a new date with days incremented
	 */
	static addDays(date: Date | string, days: number) {
		if (typeof date == 'string') date = new Date(date);
		date.setDate(date.getDate() + days);
		return date;
	}

	/**
	 * Get a range of dates inclusive between a start and end date
	 * @param {Date | string} startDate
	 * @param {Date | string} endDate
	 * @returns {string[]} - Returns a string array of inclusive dates
	 */
	static getDateRange(startDate: Date | string, endDate: Date | string): string[] {
		const dateArray = new Array();
		let currentDateObject = new Date(startDate);
		const endDateObject = new Date(endDate);
		while (currentDateObject <= endDateObject) {
			const newDate: string = new Date(currentDateObject).toISOString().slice(0, 10);
			if (dateArray.includes(newDate)) break;
			dateArray.push(newDate);
			DateUtils.addDays(currentDateObject, 1);
		}
		return dateArray;
	}

	/**
	 * Get number of days between a start and end date
	 * @param {Date | string} startDate
	 * @param {Date | string} endDate
	 * @returns {number} - Returns a number
	 */
	static daysBetweenStartAndEndDates(startDate: Date, endDate: Date): number {
		let differenceInTime = endDate.getTime() - startDate.getTime();
		return differenceInTime / (1000 * 3600 * 24);
	}

	/**
	 * Format a date for email templates
	 * @param {Date | string} date
	 * @returns {string} - Returns a string
	 */
	static formatDateForUser(date: string | Date) {
		if (date === 'N/A') return date;
		let newDate = new Date(`${date}`);
		return `${(newDate.getMonth() + 1).toString()}-${newDate.getDay()}-${newDate.getFullYear()}`;
	}

	/**
	 * Convert 24 hour time format to am/pm time format
	 * @param {string | number} time
	 * @returns {string} - Returns a string
	 */
	static convertTwentyFourHourTime(time: string | number): string {
		if (!time) return '';

		let sanitizedTime: number = parseInt(time.toString().replace(/\D+/g, ''));
		if (sanitizedTime > 1259) {
			sanitizedTime = sanitizedTime - 1200;
			if (sanitizedTime.toString().length === 3) {
				let minutes = sanitizedTime.toString().slice(-2);
				let hour = sanitizedTime.toString().slice(0, 1);
				return `${hour}:${minutes} PM`;
			} else if (sanitizedTime.toString().length === 4) {
				let minutes = sanitizedTime.toString().slice(-2);
				let hours = sanitizedTime.toString().slice(0, 2);
				return `${hours}:${minutes} PM`;
			} else {
				return '';
			}
		}
		if (sanitizedTime.toString().length === 3) {
			let minutes = sanitizedTime.toString().slice(-2);
			let hour = sanitizedTime.toString().slice(0, 1);
			return `${hour}:${minutes} AM`;
		} else if (sanitizedTime.toString().length === 4) {
			let minutes = sanitizedTime.toString().slice(-2);
			let hours = sanitizedTime.toString().slice(0, 2);
			return `${hours}:${minutes} ${hours === '12' ? 'PM' : 'AM'}`;
		} else {
			return '';
		}
	}
}

class StringUtils extends BaseStringUtils {
	/**
	 * Checks to see if the regex express passes on the given value
	 * @name testRegex
	 * @param {regex} - The regular expression to run on the value
	 * @param {value} - A string value to check with the regular express
	 * @returns {boolean} - Returns true if the matching pattern was found
	 */
	static testRegex(regex: RegExp, value: string): boolean {
		regex = new RegExp(regex);
		return regex.test(value);
	}

	/**
	 * Generate a unique GUID
	 * @name generateGuid
	 * @returns {string} - Returns a string unique GUID
	 * */
	static generateGuid(): string {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0,
				v = c == 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	static capitalizeFirst(value): string {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}

	static btoa(dataString: string): string {
		return Buffer.from(dataString).toString('base64');
	}

	static atob(base64String: string): string {
		return Buffer.from(base64String, 'base64').toString();
	}

	/**
	 * Returns whether or not the two strings are equal, ignoring case
	 * @name areEqualInsensitive
	 * @param {string} - The first string to compare
	 * @param {string} - The second string to compare
	 * @param {string} - An optional locale code. Defaults to 'en'
	 * @returns {boolean} - Returns whether the two are equal
	 */
	static areEqualInsensitive(a: string, b: string, locale?: string): boolean {
		return a.localeCompare(b, locale || 'en', { sensitivity: 'accent' }) === 0;
	}

	/**
	 * Returns a 'clean' string with no carriage return, tab or new line and removes all additional spaces
	 * @name removeLineEndings
	 * @param {string} value - The string to clean
	 * @returns {string} - Returns the cleaned version of the string
	 */
	static removeLineEndings(value: string): string {
		if (!value) return;
		return value
			.replace(/\r?\n|\t|\r/g, ' ') // remove carriage return, new line, and tab
			.match(/[^ ]+/g) // remove extra spaces
			.join(' '); // return to single space
	}
}

class ObjectUtils extends BaseObjectUtils {
	/**
	 * Returns the stripped off data object from a standard database response
	 * @name toData
	 * @param {object} - A standard RsResponseData from the database layer
	 * @returns {object} - Returns the base object nested within the RsResponseData
	 */
	static toData(obj: RedSky.RsResponseData<any>): object | any {
		if (obj && (obj.data || obj.data === false)) {
			return obj.data;
		}
		return obj;
	}

	/**
	 * Returns a base object either through JSON.parse or a clone of the original object
	 * @name smartParse
	 * @param json
	 * @returns {object} - Returns a json object of the stringified object
	 */
	static smartParse(json: any): object | any {
		if (!json) return {};
		try {
			return JSON.parse(json);
		} catch (e) {
			return ObjectUtils.deepClone(json);
		}
	}

	/**
	 * Returns a boolean to determine if the value is an array and that array contains data
	 * @name isArrayWithData
	 * @param {any}
	 * @returns {boolean} - Returns a boolean value
	 * */
	static isArrayWithData(possibleArray: any) {
		return !!(possibleArray && Array.isArray(possibleArray) && possibleArray.length > 0);
	}

	/**
	 * Groups a dataset by a property.
	 * @param dataset - The dataset to group
	 * @param property - The property to group by
	 * @returns {Object}
	 */
	static group(dataset: any[], property: string) {
		let res = {};
		for (let i in dataset) {
			if (!res[dataset[i][property]]) res[dataset[i][property]] = [];

			res[dataset[i][property]].push(dataset[i]);
		}
		return res;
	}

	/**
	 * Filter an object down to specific field list
	 * @param obj {Object} - A given object you wish to filter over
	 * @param fields {string[]} - An array of columns(keys) wished to return from object
	 * @returns {Object}
	 * */
	static filterObject(obj: any, fields: string[]) {
		for (let i in obj) {
			if (fields.includes(i)) continue;
			delete obj[i];
		}
		return obj;
	}

	/**
	 * Copy an object to pass by value
	 * @param {Object} obj - Any object you wish to have a deep copy of
	 * @returns {Object}
	 * */
	static copy(obj: any) {
		return this.smartParse(JSON.stringify(obj));
	}

	/**
	 * Cast a value to a boolean value
	 * @param data - Any value that you want to actually evaluate to a boolean value
	 * @return {boolean}
	 */
	static toBoolean(data: any) {
		return !!!(data === 'false' || !data);
	}

	/**
	 * Dedupe an array of objects
	 * @param {any[]} dataset - an array of objects
	 * @param {string} property - property string you wish to dedupe on
	 * @returns {any[]} - Deduped version of the original dataset
	 */
	static dedupe(dataset: any[], property: string) {
		const res = [];
		const existsValue = [];
		for (let data of dataset) {
			if (existsValue.includes(data[property])) continue;
			res.push(data);
			existsValue.push(data[property]);
		}
		return res;
	}

	/**
	 * Dedupe an array of objects with a compound key
	 * @param {any[]} dataset - an array of objects
	 * @param {...string[]} properties - property string you wish to dedupe on
	 * @returns {any[]} - Deduped version of the original dataset
	 */
	static multiPropDedupe<T extends Object>(dataset: T[], ...properties: string[]): T[] {
		if (properties.length === 0) return dataset;
		const values: T[] = [];
		for (let data of dataset) {
			if (
				values.some(function (obj) {
					for (let prop of properties) {
						if (data[prop] !== obj[prop]) return false;
					}
					return true;
				})
			)
				continue;
			values.push(data);
		}
		return values;
	}

	/**
	 * Sort the attributes of an object to return ASC
	 * @param {any} dataset - any singular object
	 * @returns {any} - Returns the given object with values sorted ASC order
	 */
	static simpleSort(dataset: any) {
		return Object.keys(dataset)
			.sort()
			.reduce(
				(accumulator, key) => ({
					...accumulator,
					[key]: dataset[key]
				}),
				{}
			);
	}

	/**
	 *
	 * @param data - the array to paginate
	 * @param page - which page of data to return
	 * @param perPage - number of items per page
	 * @returns - a new array made up of the page of data from the original array
	 */
	static paginateArray<T>(data: T[], page: number, perPage: number): T[] {
		const offset = page * perPage - perPage;
		return data.slice(offset, page * perPage);
	}

	/**
	 * Deep clone an object or array
	 * @name clone
	 * @param {any} obj
	 * @returns {object}
	 * @example
	 * clone({a:"red",b: {b1:"blue",b2:"red"}})
	 */
	static deepClone<T>(obj: T): T {
		if (obj === null || obj === undefined) {
			return null;
		}
		if (Array.isArray(obj)) {
			return ObjectUtils.forceCast<T>(obj.map((element) => ObjectUtils.deepClone(element)));
		}
		if (obj instanceof Date) return (new Date(obj) as unknown) as T;
		if (typeof obj !== 'object') {
			return obj;
		}
		const clone = Object.create(ObjectUtils.forceCast<object>(obj));

		for (let key in obj) {
			if (obj.hasOwnProperty(key) === true) {
				const value = obj[key];
				clone[key] = ObjectUtils.deepClone(value);
			}
		}
		return clone;
	}

	/**
	 * Tests if passed in value is an object and is not null
	 * @param credentials
	 */
	static isObject(obj: any): boolean {
		return typeof obj === 'object' && obj !== null;
	}

	/**
	 * Removes all elements from an array that do not meet the condition
	 * Based on the answer here https://stackoverflow.com/a/57685728
	 * @param array The array to prune
	 * @param condition A method to identify the elements to keep
	 * @returns An array of the elements removed
	 */
	static pruneInPlace<T>(array: T[], condition: (value: T) => boolean): T[] {
		let next_place = 0;
		const removed: T[] = [];

		for (let value of array) {
			if (condition(value)) array[next_place++] = value;
			else removed.push(value);
		}

		array.splice(next_place);
		return removed;
	}

	/**
	 * Syntactic sugar for force casting a variable
	 * @param obj
	 * @returns
	 */
	static forceCast<T>(obj: any): T {
		return (obj as unknown) as T;
	}
}

class NumberUtils {
	/**
	 * @name dollarsToCents
	 * @param {dollars} - The floating point dollar value
	 * @returns {number} - The integer number of cents
	 */
	static dollarsToCents(dollars: number): number {
		return parseInt((dollars * 100).toFixed(0));
	}

	static centsToDollars(cents: number): number {
		return parseFloat((cents / 100).toFixed(2));
	}

	/**
	 *
	 * @param {number} cents - The price in cents
	 * @param {number} conversionRate - The number of cents per point (default 10)
	 * @param {number} roundToNext - The number of points to round up to (default 1000)
	 * @returns {number} - The price in points
	 */
	static centsToPoints(cents: number, conversionRate: number = 0.7, roundToNext: number = 1000): number {
		return NumberUtils.round(cents / conversionRate, roundToNext);
	}

	static round(num: number, significance: number): number {
		if (num === 0) return 0;
		const sign = Math.sign(num);
		num = Math.abs(num);
		significance = Math.abs(Math.trunc(significance));
		const mod = num % significance;
		if (mod === 0) {
			return num;
		}
		return sign * (num - mod + significance);
	}
}

class RedisUtils {
	static generateReservationRefreshDateKey(destinationId: number) {
		return `destination:${destinationId}:refresh:reservation`;
	}
	/**
	 * @name getValidBlockInfo
	 * @param {string} reservationBlock
	 * @returns {{destinationId, month, year, daysInMonth}} - info from the current block
	 */
	static getValidBlockInfo(
		reservationBlock: string
	): { destinationId: number; month: number; year: number; daysInMonth: number } {
		const blockArray = reservationBlock.split('-');
		let destinationId: number;
		if (blockArray.length === 5) {
			destinationId = parseInt(blockArray.splice(0, 2)[1]);
		} else {
			destinationId = parseInt(blockArray.shift());
		}
		const month = parseInt(blockArray[1]);
		const year = parseInt(blockArray[0]);
		const today = new Date();
		const currentMonth = today.getUTCMonth() + 1;
		const currentYear = today.getUTCFullYear();
		if (year < currentYear) {
			throw new RsError('BAD_REQUEST', `INVALID DATE RANGE ${reservationBlock} - EXPIRED YEAR`);
		} else if (year === currentYear && month < currentMonth) {
			throw new RsError('BAD_REQUEST', `INVALID DATE RANGE ${reservationBlock} - EXPIRED MONTH`);
		}
		const daysInMonth = DateUtils.daysInMonth(month, year);
		return { destinationId, month, year, daysInMonth };
	}
	/**
	 * @name getDestinationSearchKeys
	 * @param {companyId} number
	 * @param {string[]} keyDateRange
	 * @param {Redis} redisClient - The Redis cache client to get keys from
	 * @returns {string[]} - search keys for the given date range
	 */
	static async getDestinationSearchKeys(
		keyDateRange: string[],
		redisClient: IRedisClient,
		companyId?: number,
		destinationId?: number
	): Promise<string[]> {
		const searchKeys: string[] = [];
		for (let keyDate of keyDateRange) {
			const companyWildcard = companyId || '*';
			const destinationWildcard = destinationId || '*';
			const matchingKeys = await redisClient.keys(`*${companyWildcard}-${destinationWildcard}-${keyDate}`, true);
			for (let key of matchingKeys) {
				if (searchKeys.includes(key)) continue;
				searchKeys.push(key);
			}
		}
		return searchKeys;
	}

	/**
	 * Gets the lowest price for the cached price object for available accommodations
	 * @name getLowestPrice
	 * @param {Redis.AvailabilityAccommodationPrice[]} prices - Accommodation Availability Price array
	 * @returns {Redis.AvailabilityAccommodationPrice} - The lowest price for the given array
	 */
	static getLowestPrice(prices: Redis.AvailabilityAccommodationPrice[]): Redis.AvailabilityAccommodationPrice {
		let lowest: Redis.AvailabilityAccommodationPrice = prices.find((p) => p.minPrice);
		if (!!lowest) return lowest;
		for (let price of prices) {
			if (!!!lowest) lowest = price;
			if (price.total < lowest.total) lowest = price;
		}
		return lowest;
	}

	/**
	 * Formats a date for use in a cache key
	 * @param {number} year
	 * @param {number} month
	 * @param {number} day
	 * @returns {string} - The formatted date string
	 */
	static getIndexDate(year: number, month: number, day: number): string {
		return `${year}-${DateUtils.padStart(month.toString())}-${DateUtils.padStart(day.toString())}`;
	}

	static getDateObjFromIndex(indexDate: string): Date {
		const dateArray = indexDate.split('-').map((num) => parseInt(num));
		return new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
	}

	static generateRefreshKey(destinationId: number, year: number, month: number) {
		return `${destinationId}-${year}-${DateUtils.padStart(month.toString())}`;
	}

	/**
	 * Formats a key string for the accommodation availability cache
	 * @param {number} destinationId
	 * @param {string} indexDate - a date string formatted by getIndexDate
	 * @returns {string} - An index key
	 */
	static generateAvailabilityIndexKey(companyId: number, destinationId: number, indexDate: string): string {
		return `${companyId}-${destinationId}-${indexDate}`;
	}

	/**
	 * Formats a key string for the upsell package availability cache
	 * @param {number} destinationId
	 * @param {string} indexDate - a date string formatted by getIndexDate
	 * @returns
	 */
	static generateUpsellPackageIndexKey(destinationId: number, indexDate: string) {
		return `${destinationId}-package-${indexDate}`;
	}
}

export { StringUtils, ObjectUtils, RegionUtils, WebUtils, DateUtils, NumberUtils, RedisUtils };
