import ITable from '../ITable';

export interface PackageToCreate extends Omit<Model.UpsellPackage, 'id'> {}
export interface PackageToUpdate extends Omit<Api.UpsellPackage.Req.Update, 'id' | 'mediaIds'> {}

export default interface IUpsellPackageTable extends ITable {
	getById: (packagesId: number, companyId?: number) => Promise<Api.UpsellPackage.Details>;
	getManyByIds: (packageIds: number[], companyId?: number) => Promise<Api.UpsellPackage.Details[]>;
	getManyByReservationId: (reservationId: number, companyId?: number) => Promise<Api.UpsellPackage.Details[]>;
	getByCompany: (companyId: number) => Promise<Api.UpsellPackage.Details[]>;
	getByPage: (
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId?: number
	) => Promise<RedSky.RsPagedResponseData<Api.UpsellPackage.Details[]>>;
	update: (
		packageId: number,
		packageToUpdate: PackageToUpdate,
		companyId: number
	) => Promise<Api.UpsellPackage.Details>;
	delete: null;
	deleteMany: null;
}
