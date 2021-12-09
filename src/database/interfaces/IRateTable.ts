import ITable from '../ITable';

export default interface IRateTable extends ITable {
	getByDestinationId: (destinationId: number) => Promise<Array<Model.Rate>>;
	delete: null;
	deleteMany: null;
}
