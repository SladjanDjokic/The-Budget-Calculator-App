import config from '../../utils/config';

const isLocalHostOrSandbox = !!config?.isLocalHost ? 'http://localhost:3001' : 'https://sand.spireloyalty.com';
const baseUrl = config.isProduction ? 'https://spireloyalty.com' : isLocalHostOrSandbox;
const permissionAuthorizationResource = {
	companyId: 1,
	userId: 1,
	baseUrl
};

export default permissionAuthorizationResource;
