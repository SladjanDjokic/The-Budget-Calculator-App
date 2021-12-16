import { TierToCreate } from '../../services/tier/tier.service';
import ITable from '../ITable';

export default interface ITierTable extends ITable {
	getById: (tierId: number) => Promise<Api.Tier.Res.Get>;
	create: (tiertoCreate: TierToCreate) => Promise<Model.Tier>;
	addFeature: (tierId: number, featureIdList: number[]) => Promise<any>;
	deleteFeaturesForTier: (tierId: number) => Promise<boolean>;
	getAll: () => Promise<Model.Tier[]>;
	delete: null;
	deleteMany: null;
}
