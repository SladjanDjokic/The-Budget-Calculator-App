import { RsError } from '../../utils/errors';
import { DateUtils } from '../../utils/utils';
import IDestinationPolicyTable from '../interfaces/IDestinationPolicyTable';
import Table from '../Table';

export default class DestinationPolicy extends Table implements IDestinationPolicyTable {
	async create(tableObj: Model.DestinationPolicy): Promise<Model.DestinationPolicy> {
		tableObj.modifiedOn = DateUtils.dbNow();

		try {
			await this.db.runQuery(`INSERT INTO ${this.tableName} SET ?;`, [tableObj]);
			return await this.get(tableObj.destinationId, tableObj.companyId, tableObj.policyType);
		} catch (e) {
			if (e.err && e.err.code === 'ER_DUP_ENTRY') throw new RsError('DUPLICATE', e.err.sqlMessage);
			throw new RsError('UNKNOWN_ERROR', e);
		}
	}

	async get(
		destinationId: number,
		companyId: number,
		policyType: Model.DestinationPolicyType
	): Promise<Model.DestinationPolicy> {
		return this.db.queryOne(
			`SELECT * FROM \`${this.tableName}\`
            WHERE \`destinationId\`=? AND \`policyType\`=? AND \`companyId\`=?`,
			[destinationId, policyType, companyId]
		);
	}

	async getForDestination(destinationId: number, companyId: number): Promise<Model.DestinationPolicy[]> {
		return this.db.runQuery(
			`SELECT * FROM \`${this.tableName}\`
            WHERE \`destinationId\`=? AND \`companyId\`=?`,
			[destinationId, companyId]
		);
	}

	public async getForCompany(companyId: number): Promise<Model.DestinationPolicy[]> {
		return this.db.runQuery(
			`SELECT * FROM \`${this.tableName}\`
            WHERE \`companyId\`=?`,
			[companyId]
		);
	}
	public async updatePolicy({
		value,
		destinationId,
		policyType,
		companyId
	}: Model.DestinationPolicy): Promise<Model.DestinationPolicy> {
		return this.db.runQuery(
			`UPDATE \`${this.tableName}\` 
            SET \`value\`=?, \`modifiedOn\`=CURRENT_TIMESTAMP 
            WHERE \`destinationId\`=? AND \`policyType\`=? AND \`companyId\`=?`,
			[value, destinationId, policyType, companyId]
		);
	}
	public async deletePolicy({
		destinationId,
		policyType,
		companyId,
		...policy
	}: Model.DestinationPolicy): Promise<Pick<Model.DestinationPolicy, 'destinationId' | 'policyType'>> {
		const result = await this.db.runQuery(
			`DELETE FROM \`${this.tableName}\`
            WHERE \`destinationId\`=? AND \`policyType\`=? AND \`companyId\`=?`,
			[destinationId, policyType, companyId]
		);
		if (result.affectedRows > 0) return { destinationId, policyType };
	}
	getById: null;
	getManyByIds: null;
	update: null;
	delete: null;
}

export const destinationPolicy = (dbArgs) => {
	dbArgs.tableName = 'destinationPolicy';
	return new DestinationPolicy(dbArgs);
};
