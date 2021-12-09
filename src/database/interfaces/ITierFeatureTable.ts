import ITable from '../ITable';

export default interface ITierFeatureTable extends ITable {
	getAll: () => Promise<Model.TierFeature[]>;
}
