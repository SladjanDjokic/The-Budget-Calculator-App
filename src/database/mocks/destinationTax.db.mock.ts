import IDestinationTaxTable from '../interfaces/IDestinationTaxTable';
import TableMock from './table.db.mock';

export default class DestinationTaxTableMock extends TableMock implements IDestinationTaxTable {
	create(taxes: Model.DestinationTax[]): Promise<Model.DestinationTax[]> {
		throw new Error('Method not implemented.');
	}
	getForCompany(companyId: number): Promise<Model.DestinationTax[]> {
		throw new Error('Method not implemented.');
	}
	getForDestination(destinationId: number, companyId: number): Promise<Model.DestinationTax[]> {
		throw new Error('Method not implemented.');
	}
	updateTaxes(taxes: Model.DestinationTax[], companyId: number): Promise<Model.DestinationTax[]> {
		throw new Error('Method not implemented.');
	}
	deleteTaxes(taxes: Model.DestinationTax[], companyId: number): Promise<Model.DestinationTax[]> {
		throw new Error('Method not implemented.');
	}
	getById: null;
	getManyByIds: null;
	update: null;
	updateMany: null;
	getByPage: null;
	delete: null;
	deleteMany: null;
	columns: string[];
}
