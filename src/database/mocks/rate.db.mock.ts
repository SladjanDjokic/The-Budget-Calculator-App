import TableMock from './table.db.mock';
import IRateTable from '../interfaces/IRateTable';

export default class RateTableMock extends TableMock implements IRateTable {
	constructor(public readonly rates: Model.Rate[] = []) {
		super();
	}
	async getByDestinationId(destinationId: number): Promise<Model.Rate[]> {
		return this.rates.filter((rate) => rate.destinationId === destinationId);
	}
	delete: null;
	deleteMany: null;
}
