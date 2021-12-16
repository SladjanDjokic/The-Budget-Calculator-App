import ITierMultiplierTable from '../interfaces/ITierMultiplierTable';
import Table from '../Table';

export default class TierMultiplier extends Table implements ITierMultiplierTable {
	update: null;
	delete: null;
	deleteMany: null;
	deleteForTestOnly(id: number) {
		return super.delete(id);
	}
}

export const tierMultiplier = (dbArgs) => {
	dbArgs.tableName = 'tierMultiplier';
	return new TierMultiplier(dbArgs);
};
