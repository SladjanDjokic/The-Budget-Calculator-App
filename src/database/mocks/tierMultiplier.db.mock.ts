import { TierMultiplierToCreate } from '../../services/tier/tier.service';
import ITierMultiplierTable from '../interfaces/ITierMultiplierTable';
import TableMock from './table.db.mock';

export default class TierMultiplierTableMock extends TableMock implements ITierMultiplierTable {
	private lastId: number;
	constructor(public readonly Multipliers: Model.TierMultiplier[] = []) {
		super();
		this.lastId = Math.max(...this.Multipliers.map((m) => m.id)) || 0;
	}
	async create(newMultiplier: TierMultiplierToCreate) {
		const insertObj: Model.TierMultiplier = {
			...newMultiplier,
			id: ++this.lastId,
			createdOn: new Date()
		};
		this.Multipliers.push(insertObj);
		return insertObj;
	}
	async getById(id: number) {
		return this.Multipliers.find((m) => m.id === id);
	}
	delete: null;
	deleteMany: null;
	update: null;
}
