import { BrandToCreate } from '../../services/brand/brand.service';
import ITable from '../ITable';

export interface BrandUpdate {
	id: number;
	name?: string;
	squareLogoUrl?: string;
	wideLogoUrl?: string;
	website?: string;
	description?: string;
	modifiedOn?: Date | string;
	externalId?: string | number;
	metaData?: string;
}

export default interface IBrandTable extends ITable {
	create: (newBrand: BrandToCreate) => Promise<Model.Brand>;
	getAll: () => Promise<Model.Brand[]>;
	getAllForCompany: (companyId: number) => Promise<Model.Brand[]>;
	getDetails: (brandId: number, companyId?: number) => Promise<Api.Brand.Res.Details>;
	update: (brandId: number, updateDetails: BrandUpdate, companyId: number) => Promise<Model.Brand>;
	delete: null;
	deleteMany: null;
}
