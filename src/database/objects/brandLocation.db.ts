import Table from '../Table';

export default class BrandLocation extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getForBrand(brandId: number, companyId: number) {
		return await this.db.runQuery(
			`SELECT * 
				FROM brandLocation
					JOIN brand ON brand.id = brandLocation.brandId
				WHERE brandLocation.brandId = ?
					AND brand.companyId = ?;`,
			[brandId, companyId]
		);
	}

	delete: null;
	deleteMany: null;
}

export const brandLocation = (dbArgs) => {
	dbArgs.tableName = 'affiliateLocation';
	return new BrandLocation(dbArgs);
};
