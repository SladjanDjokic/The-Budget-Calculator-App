import Table from '../Table';
import mysql from 'mysql';
import { ObjectUtils } from '../../utils/utils';

export default class VendorView extends Table {
	constructor(dbArgs: any) {
		super(dbArgs);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	): Promise<RedSky.RsPagedResponseData<Api.Vendor.Res.Get[]>> {
		sort.field = 'name';
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		let allObjects = await this.db.runQuery(
			`SELECT name, destinationId, brandId 
            FROM ${this.tableName}
            WHERE
            (${pageQuery.filterQuery})
            ${pageQuery.sortQuery} 
            LIMIT ?
            OFFSET ?;
            SELECT Count(name) as total
            FROM ${this.tableName}
            WHERE
            (${pageQuery.filterQuery});`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	getByDestinationId(id: number): Promise<Model.Vendor> {
		return this.db.queryOne(`SELECT * FROM \`vendor\` WHERE destinationId=?`, [id]);
	}
	getByBrandId(id: number): Promise<Model.Vendor> {
		return this.db.queryOne(`SELECT * FROM \`vendor\` WHERE brandId=?`, [id]);
	}

	getById: null;
	getManyByIds: null;
	update: null;
	updateMany: null;
	delete: null;
	deleteMany: null;
	create: null;
}

export const vendor = (dbArgs: any) => {
	dbArgs.tableName = 'vendor';
	return new VendorView(dbArgs);
};
