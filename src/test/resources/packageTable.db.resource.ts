import { DateUtils } from '../../utils/utils';
import { PackageToCreate, PackageToUpdate } from '../../database/interfaces/IUpsellPackageTable';

const companyId = 1;
const destinationId = 3;
const createRequest: PackageToCreate = {
	companyId,
	destinationId,
	title: 'Test Package',
	externalTitle: 'Test Package',
	description:
		'A new package for testing purposes. If this package persists for more than a few seconds, please consult a developer.',
	isActive: 1,
	code: 'TEST' + new Date().getTime(),
	startDate: null,
	endDate: null,
	pricingType: 'PerStay'
};
const updateRequest: PackageToUpdate = {
	endDate: DateUtils.addDays(new Date(), 600),
	isActive: 0
};
const packageResource = { companyId, createRequest, updateRequest };
export default packageResource;
