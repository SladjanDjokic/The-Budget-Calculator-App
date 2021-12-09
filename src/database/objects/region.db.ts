import Table from '../Table';
import IRegionTable from '../interfaces/IRegionTable';
import { ObjectUtils } from '../../utils/utils';

export default class Region extends Table implements IRegionTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async get(): Promise<Api.Region.Res.Get[]> {
		return this.db.runQuery(`SELECT id, \`name\` FROM region WHERE isActive IS TRUE;`);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	): Promise<RedSky.RsPagedResponseData<Api.Region.Res.Detail[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		let allObjects = await this.db.runQuery(
			`SELECT *
			FROM region
			WHERE
			 ${pageQuery.filterQuery}
			 ${pageQuery.sortQuery} 
			 LIMIT ?
			 OFFSET ?; SELECT Count(id) as total FROM region WHERE ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	create(regionToCreate: Api.Region.Req.Create): Promise<Api.Region.Res.Detail> {
		return super.create(regionToCreate);
	}

	deleteForTestOnly(id: number): Promise<void> {
		return this.db.runQuery('DELETE FROM region WHERE id = ?;', [id]);
	}
	delete: null;
	deleteMany: null;
}

export const region = (dbArgs) => {
	dbArgs.tableName = 'region';
	return new Region(dbArgs);
};
