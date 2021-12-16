import CompanyTableMock from '../../database/mocks/company.db.mock';
import CompanyVariablesTableMock from '../../database/mocks/companyVariables.db.mock';

const company: Model.Company = {
	id: 2,
	isActive: 1,
	loyaltyStatus: 'PENDING',
	name: 'Rentyl',
	squareLogoUrl: '',
	wideLogoUrl: '',
	description: 'rentyl properties',
	createdOn: '',
	modifiedOn: '',
	vanityUrls: ['rentyl.com'],
	privacyPolicyUrl: '',
	termsConditionsUrl: '',
	returnPolicyUrl: '',
	address: '',
	city: '',
	state: '',
	zip: '',
	country: ''
};

const company2: Model.Company = {
	id: 3,
	isActive: 1,
	loyaltyStatus: 'PENDING',
	name: 'Acme Company',
	squareLogoUrl: '',
	wideLogoUrl: '',
	description: 'acme rentyl properties',
	createdOn: '',
	modifiedOn: '',
	vanityUrls: ['acmerentyl.com'],
	privacyPolicyUrl: '',
	termsConditionsUrl: '',
	returnPolicyUrl: '',
	address: '',
	city: '',
	state: '',
	zip: '',
	country: ''
};

const companyAndClientVariables: Api.Company.Res.GetCompanyAndClientVariables = {
	id: 1,
	name: 'RedSky',
	squareLogoUrl: '',
	wideLogoUrl: '',
	allowCashBooking: 1,
	allowPointBooking: 1,
	customPages: {},
	unauthorizedPages: []
};

const adminUserRole: Model.UserRole = {
	accessScope: [],
	createdOn: '',
	id: 1,
	isAdmin: 1,
	isCustomer: 0,
	modifiedOn: '',
	name: 'admin'
};

const companyTable = new CompanyTableMock([company, company2]);
const companyVariablesTable = new CompanyVariablesTableMock();

const companyResource = {
	companyId: 1,
	companyTable,
	companyVariablesTable,
	companyAndClientVariables,
	adminUserRole
};

export default companyResource;
