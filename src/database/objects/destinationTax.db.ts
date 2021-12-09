import IDestinationTaxTable from '../interfaces/IDestinationTaxTable';
import Table from '../Table';

export default class DestinationTax extends Table implements IDestinationTaxTable {
	async updateTaxes(taxes: Model.DestinationTax[], companyId: number): Promise<Model.DestinationTax[]> {
		const completed: Model.DestinationTax[] = [];
		for (let tax of taxes) {
			await this.db.runQuery(
				`UPDATE \`destinationTax\`
                SET \`name\`=?
                WHERE \`companyId\`=? 
                    AND \`destinationId\`=? 
                    AND \`code\`=?;`,
				[tax.name, companyId, tax.destinationId, tax.code]
			);
			completed.push(await this.get(tax.destinationId, tax.companyId, tax.code));
		}
		return completed;
	}
	async deleteTaxes(taxes: Model.DestinationTax[], companyId: number): Promise<Model.DestinationTax[]> {
		for (let tax of taxes) {
			await this.db.runQuery(
				`DELETE FROM \`destinationTax\`
                WHERE \`companyId\`=? AND \`destinationId\`=? AND \`code\`=?;`,
				[companyId, tax.destinationId, tax.code]
			);
		}
		return taxes;
	}
	async create(taxes: Model.DestinationTax[]): Promise<Model.DestinationTax[]> {
		const completed: Model.DestinationTax[] = [];
		for (let tax of taxes) {
			await this.db.runQuery(`INSERT INTO \`destinationTax\` SET ?;`, [tax]);
			completed.push(await this.get(tax.destinationId, tax.companyId, tax.code));
		}
		return completed;
	}
	async get(destinationId: number, companyId: number, code: string): Promise<Model.DestinationTax> {
		return this.db.queryOne(
			`SELECT * FROM \`destinationTax\` WHERE \`destinationId\`=? AND \`companyId\`=? AND \`code\`=?;`,
			[destinationId, companyId, code]
		);
	}
	async getForCompany(companyId: number): Promise<Model.DestinationTax[]> {
		return this.db.runQuery(
			`SELECT *
            FROM \`destinationTax\`
            WHERE \`companyId\`=?`,
			[companyId]
		);
	}
	async getForDestination(destinationId: number, companyId: number): Promise<Model.DestinationTax[]> {
		return this.db.runQuery(
			`SELECT *
            FROM \`destinationTax\` 
            WHERE \`destinationId\`=? AND \`companyId\`=?`,
			[destinationId, companyId]
		);
	}
	getById: null;
	getManyByIds: null;
	getByPage: null;
	update: null;
	updateMany: null;
	delete: null;
	deleteMany: null;
}

export const destinationTax = (dbArgs) => {
	dbArgs.tableName = 'destinationTax';
	return new DestinationTax(dbArgs);
};
