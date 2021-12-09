import IUpsellPackageTable, { PackageToUpdate } from '../interfaces/IUpsellPackageTable';
import TableMock from './table.db.mock';

export default class UpsellPackageTableMock extends TableMock implements IUpsellPackageTable {
	columns: string[] = [
		'id',
		'companyId',
		'destinationId',
		'title',
		'description',
		'code',
		'isActive',
		'startDate',
		'endDate'
	];

	constructor(
		public readonly UpsellPackages: Api.UpsellPackage.Details[],
		public readonly reservationUpsellPackages: Model.ReservationUpsellPackage[] = []
	) {
		super();
	}

	async getById(packagesId: number): Promise<Api.UpsellPackage.Details> {
		return this.UpsellPackages.find((p) => packagesId === p.id);
	}
	async getManyByIds(upsellPackageIds: number[]): Promise<Api.UpsellPackage.Details[]> {
		return this.UpsellPackages.filter((p) => upsellPackageIds.includes(p.id));
	}
	async getManyByReservationId(reservationId: number): Promise<Api.UpsellPackage.Details[]> {
		const linkedUpsellPackages: number[] = this.reservationUpsellPackages
			.filter((r) => r.reservationId === reservationId)
			.map((r) => r.upsellPackageId);
		return this.UpsellPackages.filter((p) => linkedUpsellPackages.includes(p.id));
	}
	async getByCompany(companyId: number): Promise<Api.UpsellPackage.Details[]> {
		return this.UpsellPackages.filter((p) => p.companyId === companyId);
	}
	async getByDestination(destinationId: number, companyId: number): Promise<Api.UpsellPackage.Res.Complete[]> {
		return this.UpsellPackages.filter((up) => up.destinationId === destinationId && up.companyId === companyId).map(
			(up) => {
				return { ...up, priceDetail: { amountBeforeTax: 0, amountAfterTax: 0, amountPoints: 0 } };
			}
		);
	}
	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery,
		companyId: number
	): Promise<RedSky.RsPagedResponseData<Api.UpsellPackage.Details[]>> {
		return { data: this.UpsellPackages, total: this.UpsellPackages.length };
	}

	async deactivate(upsellPackageId: number): Promise<number> {
		const index = this.UpsellPackages.findIndex((p) => p.id === upsellPackageId);
		const upsellPackage = this.UpsellPackages.splice(index, 1)[0];
		upsellPackage.isActive = 0;
		this.UpsellPackages.push(upsellPackage);
		return upsellPackageId;
	}

	create: (tableObj: any, companyId?: number) => Promise<any>;
	async update(
		packageId: number,
		packageToUpdate: PackageToUpdate,
		companyId: number
	): Promise<Api.UpsellPackage.Details> {
		const index = this.UpsellPackages.findIndex((p) => p.id === packageId);
		let upsellPackage = this.UpsellPackages.splice(index, 1)[0];
		upsellPackage = { ...upsellPackage, ...packageToUpdate };
		this.UpsellPackages.push(upsellPackage);
		return this.getById(packageId);
	}
	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	delete: null;
	deleteMany: null;
}
