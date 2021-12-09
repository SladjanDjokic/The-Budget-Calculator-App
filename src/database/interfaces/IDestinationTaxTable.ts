import ITable from '../ITable';

export default interface IDestinationTaxTable extends ITable {
	create(taxes: Model.DestinationTax[]): Promise<Model.DestinationTax[]>;
	getForCompany(companyId: number): Promise<Model.DestinationTax[]>;
	getForDestination(destinationId: number, companyId: number): Promise<Model.DestinationTax[]>;
	updateTaxes(taxes: Model.DestinationTax[], companyId: number): Promise<Model.DestinationTax[]>;
	deleteTaxes(taxes: Model.DestinationTax[], companyId: number): Promise<Model.DestinationTax[]>;
	getById: null;
	getManyByIds: null;
	update: null;
	updateMany: null;
	getByPage: null;
	delete: null;
	deleteMany: null;
}
