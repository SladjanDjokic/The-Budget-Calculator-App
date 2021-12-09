import mysql from 'mysql';
import { RsError } from '../utils/errors';
import DatabaseUtil, { dbUtils } from './dbUtils';
import { CustomPool } from '../@types/mysqlCustom';
import { DateUtils, ObjectUtils } from '../utils/utils';
import ITable, { TableArgs } from './ITable';

export default class Table implements ITable {
	db: CustomPool;
	tableName: string;
	meta: any;
	columns: string[];
	dbUtil: DatabaseUtil;

	constructor(dbArgs: TableArgs) {
		this.db = dbArgs.connection;
		this.tableName = dbArgs.tableName;
		this.meta = null;
		this.columns = null;
		this.dbUtil = dbUtils(this.db);

		this.dbUtil.getColumns(dbArgs.tableName).then((columns) => {
			this.columns = columns;
		});
	}

	async create(tableObj): Promise<any> {
		tableObj = Table.columnObjectStringify(tableObj);
		if (this.columns.includes('createdOn') && !tableObj.createdOn) {
			tableObj.createdOn = DateUtils.dbNow();
		}
		if (this.columns.includes('modifiedOn') && !tableObj.modifiedOn) {
			tableObj.modifiedOn = DateUtils.dbNow();
		}
		try {
			const result = await this.db.runQuery(`INSERT INTO ${this.tableName} SET ?;`, [tableObj]);
			return this.getById(tableObj.id || result.insertId, tableObj.companyId);
		} catch (e) {
			if (e.err && e.err.code === 'ER_DUP_ENTRY') throw new RsError('DUPLICATE', e.err.sqlMessage);
			throw new RsError('UNKNOWN_ERROR', e.err.sqlMessage);
		}
	}

	async getById(objId: number, companyId?: number): Promise<any> {
		return this.db.queryOne(
			`SELECT  *  FROM \`${this.tableName}\` WHERE id=? AND ${Table.buildCompanyIdQuery(
				companyId,
				this.tableName
			)};`,
			[objId]
		);
	}

	async getManyByIds(objIds: number[], companyId?: number): Promise<any> {
		return this.db.runQuery(
			`SELECT  *  FROM \`${this.tableName}\` WHERE id in (?) AND ${Table.buildCompanyIdQuery(
				companyId,
				this.tableName
			)};`,
			[objIds]
		);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<any> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQueryString = companyId ? mysql.format(' companyId=? AND', [companyId]) : '';
		let allObjects = await this.db.runQuery(
			`SELECT *
			 FROM ${this.tableName}
			 WHERE
			 ${companyIdQueryString}
			 (${pageQuery.filterQuery})
			 ${pageQuery.sortQuery} 
			 LIMIT ?
			 OFFSET ?; SELECT Count(id) as total FROM ${this.tableName} WHERE ${companyIdQueryString} (${pageQuery.filterQuery});`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	async update(id: number, tableObj: any, companyId?: number): Promise<any> {
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		if (this.columns) {
			if (this.columns.includes('modifiedOn')) tableObj.modifiedOn = DateUtils.dbNow();
		}

		tableObj = Table.columnObjectStringify(tableObj);

		await this.db.runQuery(`UPDATE \`${this.tableName}\` SET ? WHERE id=? AND ${companyIdQueryString}`, [
			tableObj,
			id
		]);

		return await this.getById(id, companyId);
	}

	async updateMany(ids: number[], tableObj: any): Promise<any> {
		if (ObjectUtils.isArrayWithData(tableObj)) {
			throw new RsError('BAD_REQUEST', 'Single update object is required for updateMany');
		}

		if (this.columns) {
			if (this.columns.includes('modifiedOn')) tableObj.modifiedOn = DateUtils.dbNow();
		}
		tableObj = Table.columnObjectStringify(tableObj);
		let result = await this.db.runQuery(`UPDATE \`${this.tableName}\` SET ? WHERE id IN (?)`, [tableObj, ids]);
		return { updated: result.affectedRows };
	}

	async delete(id: number, companyId?: number): Promise<number> {
		const companyQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		await this.db.runQuery(`DELETE FROM \`${this.tableName}\` WHERE id=? AND ${companyQueryString};`, [id]);
		return id;
	}

	async deleteMany(ids: number[], companyId?: number): Promise<any> {
		const companyQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		let result = await this.db.runQuery(
			`DELETE FROM \`${this.tableName}\` WHERE id IN (?) AND ${companyQueryString};`,
			[ids]
		);
		return { deleted: result.affectedRows };
	}

	async isInCompany(companyId: number, tableIds: number[]): Promise<boolean> {
		const result = await this.db.runQuery(`SELECT * FROM \`${this.tableName}\` WHERE companyId=? AND id IN (?)`, [
			companyId,
			tableIds
		]);
		return ObjectUtils.isArrayWithData(result);
	}

	protected buildDateRangeQuery(start, end, tableName: string = '', numericColumn: string = 'createdOn') {
		if (!tableName) tableName = this.tableName;
		if (start && end) {
			return mysql.format(`${tableName}.${numericColumn} BETWEEN ? AND ?`, [start, end]);
		} else if (start) {
			return mysql.format(`${tableName}.${numericColumn} > ?`, start);
		} else if (end) {
			return mysql.format(`${tableName}.${numericColumn} < ?`, end);
		} else {
			return 'TRUE';
		}
	}

	protected buildPageQuery(sort: RedSky.SortQuery, tableName: string, filter?: RedSky.FilterQuery) {
		let sortQuery = '';
		let filterQuery = 'TRUE';
		if (!tableName) tableName = this.tableName;
		if (sort.order === 'RAND') sortQuery = ` ORDER BY RAND() `;
		else if (sort.order === 'NONE') sortQuery = '';
		else {
			if (sort.field.includes('.')) {
				sortQuery = mysql.format(` ORDER BY ${sort.field} ${sort.order} `, []);
			} else sortQuery = mysql.format(` ORDER BY \`${tableName}\`.${sort.field} ${sort.order} `, []);
		}
		if (!ObjectUtils.isEmptyObject(filter)) {
			filterQuery = this.buildFilterQuery(filter, tableName);
		}
		return { sortQuery, filterQuery };
	}

	protected buildFilterQuery(filterObjects: RedSky.FilterQuery, tableName: string) {
		const filterArray = [];
		let finalArray = [];
		let conjunctionType: RedSky.ConjunctionTypes = 'AND';
		for (let filter of filterObjects.searchTerm) {
			let filterMatchType = filter.matchType || filterObjects.matchType;
			conjunctionType = filter.conjunction ? filter.conjunction : 'AND';
			if (filterMatchType === 'exact') {
				filterArray.push(this.formatExactMatch(filter, tableName));
			} else if (filterMatchType === 'like') {
				filterArray.push(this.handleLikeMatch(filter, tableName));
			} else if (filterMatchType === 'greaterThan') {
				filterArray.push(this.handleGreaterThanMatch(filter, tableName));
			} else if (filterMatchType === 'greaterThanEqual') {
				filterArray.push(this.handleGreaterThanEqualMatch(filter, tableName));
			} else if (filterMatchType === 'lessThan') {
				filterArray.push(this.handleLessThanMatch(filter, tableName));
			} else if (filterMatchType === 'lessThanEqual') {
				filterArray.push(this.handleLessThanEqualMatch(filter, tableName));
			}
			if (filterArray.length === 1) {
				finalArray.push(`${filterArray.pop()}`);
			}
			if (finalArray.length > 1) {
				const conjunctionString = finalArray.join(conjunctionType);
				finalArray = [conjunctionString];
			}
		}
		if (ObjectUtils.isArrayWithData(finalArray)) return `(${finalArray.join(conjunctionType)})`;
		return ' TRUE ';
	}

	protected static columnObjectStringify(tableObj: any) {
		for (let i in tableObj) {
			if (tableObj[i] != null && typeof tableObj[i] == 'object') {
				tableObj[i] = JSON.stringify(tableObj[i]);
			}
		}
		return tableObj;
	}

	protected static readonly concatenateMediaObject: string = `
		CONCAT(
			'{',
				'"id":',media.id,
				',"uploaderId":', media.uploaderId,
				',"type":"', media.type,
				'","urls":', media.urls,
				',"title":"', IFNULL(media.title,''),
				'","description":"', IFNULL(media.description,''),
				'","isPrimary":', media.isPrimary,
			'}'
		)`;

	protected static readonly mediaNotFoundObject: string = `
	[{
		"description": "",
		"id": 1,
		"isPrimary": 1,
		"title": "",
		"type": "imagePyramid",
		"uploaderId": 1,
		"urls": {
			"thumb":"https://ik.imagekit.io/redsky/spire/noImageFound.png",
			"small":"https://ik.imagekit.io/redsky/spire/noImageFound.png",
			"large":"https://ik.imagekit.io/redsky/spire/noImageFound.png",
			"imageKit":"https://ik.imagekit.io/redsky/spire/noImageFound.png"
		}
	}]`;

	protected static readonly concatenateMediaArray: string = `
		IFNULL(
			CONCAT('[',
				GROUP_CONCAT(${Table.concatenateMediaObject}),
			']'),
		'[]') AS media`;

	protected static buildCompanyIdQuery(companyId?: number, tableName?: string): string {
		if (!!!companyId) return 'TRUE';
		const column = !!tableName ? mysql.format('??.companyId', [tableName]) : 'companyId';
		if (!!companyId) return mysql.format(`${column}=?`, [companyId]);
	}

	private handleLikeMatch(filter: RedSky.FilterQueryValue, tableName: string) {
		const conjunctionType: RedSky.ConjunctionTypes = filter.conjunction || 'AND';
		if (ObjectUtils.isArrayWithData(filter.value)) {
			let filterValueArr = filter.value as string[] | number[];
			const filterArray = [];
			for (let k in filterValueArr) {
				filterArray.push(this.formatLikeQuery(filter.column, filterValueArr[k], tableName));
			}
			return filterArray.join(conjunctionType);
		}
		let searchValue = filter.value as string | number;
		return this.formatLikeQuery(filter.column, searchValue, tableName);
	}

	private handleGreaterThanMatch(filter: RedSky.FilterQueryValue, tableName: string) {
		const conjunctionType: RedSky.ConjunctionTypes = filter.conjunction || 'AND';
		if (ObjectUtils.isArrayWithData(filter.value)) {
			const filterValueList = filter.value as number[];
			const filterList = [];
			for (let value of filterValueList) {
				filterList.push(this.formatGreaterThanQuery(filter.column, value, tableName));
			}
			return filterList.join(conjunctionType);
		}
		let searchValue = filter.value as number;
		return this.formatGreaterThanQuery(filter.column, searchValue, tableName);
	}

	private handleGreaterThanEqualMatch(filter: RedSky.FilterQueryValue, tableName: string) {
		const conjunctionType: RedSky.ConjunctionTypes = filter.conjunction || 'AND';
		if (ObjectUtils.isArrayWithData(filter.value)) {
			const filterValueList = filter.value as number[];
			const filterList = [];
			for (let value of filterValueList) {
				filterList.push(this.formatGreaterThanEqualQuery(filter.column, value, tableName));
			}
			return filterList.join(conjunctionType);
		}
		let searchValue = filter.value as number;
		return this.formatGreaterThanEqualQuery(filter.column, searchValue, tableName);
	}

	private handleLessThanMatch(filter: RedSky.FilterQueryValue, tableName: string) {
		const conjunctionType: RedSky.ConjunctionTypes = filter.conjunction || 'AND';
		if (ObjectUtils.isArrayWithData(filter.value)) {
			const filterValueList = filter.value as number[];
			const filterList = [];
			for (let value of filterValueList) {
				filterList.push(this.formatLessThanQuery(filter.column, value, tableName));
			}
			return filterList.join(conjunctionType);
		}
		let searchValue = filter.value as number;
		return this.formatLessThanQuery(filter.column, searchValue, tableName);
	}

	private handleLessThanEqualMatch(filter: RedSky.FilterQueryValue, tableName: string) {
		const conjunctionType: RedSky.ConjunctionTypes = filter.conjunction || 'AND';
		if (ObjectUtils.isArrayWithData(filter.value)) {
			const filterValueList = filter.value as number[];
			const filterList = [];
			for (let value of filterValueList) {
				filterList.push(this.formatLessThanEqualQuery(filter.column, value, tableName));
			}
			return filterList.join(conjunctionType);
		}
		let searchValue = filter.value as number;
		return this.formatLessThanEqualQuery(filter.column, searchValue, tableName);
	}

	private formatExactMatch(filter: RedSky.FilterQueryValue, tableName: string) {
		if (ObjectUtils.isArrayWithData(filter.value)) {
			return this.formatInQuery(filter.column, filter.value as string[] | number[], this.tableName);
		}
		if (filter.column.includes('.')) {
			return mysql.format(` ? `, [{ [`${filter.column}`]: filter.value }]);
		}
		return mysql.format(` ? `, [{ [`${tableName}.${filter.column}`]: filter.value }]);
	}

	private formatLikeQuery(attribute: string, value: string | number, tableName: string) {
		let searchValue = `%${value}%`;
		if (attribute.includes('.')) {
			return mysql.format(` ${attribute} like ? `, [searchValue]);
		}
		return mysql.format(` ${tableName}.${attribute} like ? `, [searchValue]);
	}

	protected formatInQuery(attribute: string, valueArray: string[] | number[], tableName: string) {
		if (attribute.includes('.')) {
			return mysql.format(` ?? IN (?) `, [`${attribute}`, valueArray]);
		}
		return mysql.format(` ?? IN (?) `, [`${tableName}.${attribute}`, valueArray]);
	}

	private formatGreaterThanQuery(attribute: string, value: number, tableName: string) {
		if (attribute.includes('.')) {
			return mysql.format(` ?? > ? `, [attribute, value]);
		}
		return mysql.format(` ?? > ? `, [`${tableName}.${attribute}`, value]);
	}

	private formatGreaterThanEqualQuery(attribute: string, value: number, tableName: string) {
		if (attribute.includes('.')) {
			return mysql.format(` ?? >= ? `, [attribute, value]);
		}
		return mysql.format(` ?? >= ? `, [`${tableName}.${attribute}`, value]);
	}

	private formatLessThanQuery(attribute: string, value: number, tableName: string) {
		if (attribute.includes('.')) {
			return mysql.format(` ?? < ? `, [attribute, value]);
		}
		return mysql.format(` ?? < ? `, [`${tableName}.${attribute}`, value]);
	}

	private formatLessThanEqualQuery(attribute: string, value: number, tableName: string) {
		if (attribute.includes('.')) {
			return mysql.format(` ?? <= ? `, [attribute, value]);
		}
		return mysql.format(` ?? <= ? `, [`${tableName}.${attribute}`, value]);
	}
}
