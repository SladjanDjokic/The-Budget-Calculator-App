import { BrandToCreate } from '../../services/brand/brand.service';
import ITable from '../ITable';

export interface BrandUpdate extends Partial<Model.Brand> {}

export default interface IBrandTable extends ITable {
	create: (newBrand: BrandToCreate) => Promise<Model.Brand>;
	getAll: () => Promise<Model.Brand[]>;
	getAllForCompany: (companyId: number) => Promise<Model.Brand[]>;
	getDetails: (brandId: number, companyId?: number) => Promise<Api.Brand.Res.Details>;
	update: (brandId: number, updateDetails: BrandUpdate, companyId: number) => Promise<Api.Brand.Res.Details>;
	delete: null;
	deleteMany: null;
}
