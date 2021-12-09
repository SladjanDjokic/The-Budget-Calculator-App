import IBrandTable from '../interfaces/IBrandTable';
import Table from '../Table';

export default class Brand extends Table implements IBrandTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	getAll(): Promise<Model.Brand[]> {
		return this.db.runQuery(`SELECT * FROM brand;`, []);
	}

	getAllForCompany(companyId: number) {
		return this.db.runQuery(`SELECT * FROM brand WHERE companyId=?;`, [companyId]);
	}

	delete: null;
	deleteMany: null;
}

export const brand = (dbArgs) => {
	dbArgs.tableName = 'affiliate';
	return new Brand(dbArgs);
};
