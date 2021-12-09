import Table from '../Table';
import { DateUtils } from '../../utils/utils';
import { RsError } from '../../utils/errors';

export default class CompanyVariables extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async create(tableObj): Promise<Model.CompanyVariables> {
		tableObj = Table.columnObjectStringify(tableObj);
		if (this.columns.includes('createdOn') && !tableObj.createdOn) {
			tableObj.createdOn = DateUtils.dbNow();
		}
		if (this.columns.includes('modifiedOn') && !tableObj.modifiedOn) {
			tableObj.modifiedOn = DateUtils.dbNow();
		}
		try {
			const result = await this.db.runQuery(`INSERT INTO ${this.tableName} SET ?;`, [tableObj]);
			return await this.getByCompanyId(result.insertId);
		} catch (e) {
			if (e.err && e.err.code === 'ER_DUP_ENTRY') throw new RsError('DUPLICATE', e.err.sqlMessage);
			throw new RsError('UNKNOWN_ERROR', e.err.sqlMessage);
		}
	}

	getByCompanyId(companyId: number): Promise<Model.CompanyVariables> {
		return this.db.queryOne('SELECT * FROM companyVariables WHERE companyId=?;', [companyId]);
	}

	async update(
		companyId: number,
		variablesToUpdate: Omit<Partial<Model.CompanyVariables>, 'companyId'>
	): Promise<boolean> {
		variablesToUpdate = Table.columnObjectStringify(variablesToUpdate);
		const result = await this.db.runQuery('UPDATE companyVariables SET ? WHERE companyId=?;', [
			variablesToUpdate,
			companyId
		]);
		return !!(result.affectedRows > 0);
	}
}

export const companyVariables = (dbArgs) => {
	dbArgs.tableName = 'companyVariables';
	return new CompanyVariables(dbArgs);
};
