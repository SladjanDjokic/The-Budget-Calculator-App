import { TierMultiplierToCreate } from '../../services/tier/tier.service';
import ITable from '../ITable';

export default interface ITierMultiplierTable extends ITable {
	create: (newMultiplier: TierMultiplierToCreate) => Promise<Model.TierMultiplier>;
	update: null;
	delete: null;
	deleteMany: null;
}
