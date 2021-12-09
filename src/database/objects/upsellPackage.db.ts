import Table from '../Table';
import { ObjectUtils } from '../../utils/utils';
import IUpsellPackageTable, { PackageToUpdate } from '../interfaces/IUpsellPackageTable';

export interface UpsellPackageToSave extends Omit<Model.UpsellPackage, 'id' | 'isActive' | 'startDate' | 'endDate'> {
	startDate?: Date | string;
	endDate?: Date | string;
}

export default class UpsellPackage extends Table implements IUpsellPackageTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async create(newUpsellPackage: UpsellPackageToSave): Promise<Api.UpsellPackage.Details> {
		return super.create(newUpsellPackage);
	}

	async getById(packageId: number, companyId?: number): Promise<Api.UpsellPackage.Details> {
		return await this.db.queryOne(
			`${this.baseQuery}
			WHERE ${this.tableName}.id=? AND ${Table.buildCompanyIdQuery(companyId, this.tableName)} GROUP BY ${
				this.tableName
			}.id;`,
			[packageId]
		);
	}

	async getManyByIds(packageIds: number[], companyId?: number): Promise<Api.UpsellPackage.Details[]> {
		return await this.db.runQuery(
			`${this.baseQuery}
			WHERE ${this.tableName}.id in (?) AND ${Table.buildCompanyIdQuery(companyId, this.tableName)} GROUP BY ${
				this.tableName
			}.id;`,
			[packageIds]
		);
	}

	async getManyByReservationId(reservationId: number): Promise<Api.UpsellPackage.Details[]> {
		return this.db.runQuery(
			`${this.baseQuery}
				JOIN reservationUpsellPackage ON
				${this.tableName}.id = reservationUpsellPackage.upsellPackageId
				JOIN reservation
					ON reservation.id = reservationUpsellPackage.reservationId 
					AND  reservation.companyId = ${this.tableName}.companyId
				WHERE reservationUpsellPackage.reservationId = ?;`,
			[reservationId]
		);
	}

	getByCompany(companyId: number): Promise<Api.UpsellPackage.Details[]> {
		return this.db.runQuery(
			`${this.baseQuery} WHERE ${this.tableName}.companyId=? GROUP BY ${this.tableName}.id;`,
			[companyId]
		);
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	): Promise<RedSky.RsPagedResponseData<Api.UpsellPackage.Details[]>> {
		let pageQuery = this.buildPageQuery(sort, this.tableName, filter);
		const pageLimit = Math.ceil((pagination.page - 1) * pagination.perPage);
		const companyIdQueryString = Table.buildCompanyIdQuery(companyId, this.tableName);
		let allObjects = await this.db.runQuery(
			`${this.baseQuery}
			WHERE
				${companyIdQueryString} AND
				${pageQuery.filterQuery}
				${pageQuery.sortQuery} 
			LIMIT ?
			OFFSET ?;
			SELECT Count(id) as total FROM ${this.tableName} WHERE ${companyIdQueryString} AND ${pageQuery.filterQuery};`,
			[pagination.perPage, pageLimit]
		);
		let total = 0;
		if (ObjectUtils.isArrayWithData(allObjects)) {
			total = allObjects[1][0].total;
		}

		return { data: allObjects[0], total };
	}

	async update(
		packageId: number,
		packageToUpdate: PackageToUpdate,
		companyId: number
	): Promise<Api.UpsellPackage.Details> {
		await this.db.runQuery(`UPDATE ${this.tableName} SET ? WHERE id=? AND companyId=?`, [
			packageToUpdate,
			packageId,
			companyId
		]);
		return await this.getById(packageId, companyId);
	}

	delete: null;
	deleteMany: null;
	deleteForTestOnly(packageId: number): Promise<number> {
		return super.delete(packageId);
	}

	private baseQuery: string = `
		SELECT
			${this.tableName}.*,
			IFNULL(packageMedia.media, '${Table.mediaNotFoundObject}') media
		FROM ${this.tableName}
			LEFT JOIN(
				SELECT 
					mediaMap.packageId,
					${Table.concatenateMediaArray}
				FROM media
						JOIN mediaMap ON mediaMap.mediaId=media.id
				GROUP BY mediaMap.mediaId
				) AS packageMedia ON packageMedia.packageId=${this.tableName}.id`;
}

export const upsellPackage = (dbArgs) => {
	dbArgs.tableName = 'upsellPackage';
	return new UpsellPackage(dbArgs);
};
