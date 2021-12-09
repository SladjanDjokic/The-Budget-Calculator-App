import Table from '../Table';
import IRateTable from '../interfaces/IRateTable';
import { TableArgs } from '../ITable';

export default class Rate extends Table implements IRateTable {
	getByDestinationId(destinationId: number): Promise<Model.Rate[]> {
		return this.db.runQuery(`SELECT * FROM ?? WHERE destinationId=?;`, [this.tableName, destinationId]);
	}
	delete: null;
	deleteMany: null;
	async deleteForTestOnly(id: number): Promise<number> {
		await this.db.runQuery(`DELETE FROM ?? WHERE id=?;`, [this.tableName, id]);
		return id;
	}
}

export const rate = (dbArgs) => {
	dbArgs.tableName = 'rate';
	return new Rate(dbArgs);
};
