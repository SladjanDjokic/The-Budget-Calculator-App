import serviceFactory from '../services/serviceFactory';
import CompanyService from '../services/company/company.service';
import config from '../utils/config';

let domainCompanyCache: { [key: string]: Model.Company } = {};

/**
 * Locates the company in the case of a multitenancy system (i.e. multiple companies on the same database). In this
 * case we are using the incoming request host name and looking at the available companies. This can be overridden in
 * the case of a localhost request with a query parameter of companyId.
 *
 * Company host match goes against company vanity_urls and then to domain name
 *
 * @param req
 * @param res
 * @param next
 */
export async function findCompany(req, res, next) {
	// this fixes an issue with documentation if localhost (/api-docs)
	if (config?.isLocalHost || req.url.includes('/api-docs')) {
		req.companyId = 1;
		return next();
	}

	let host = req.headers.host;
	if (host.includes('localhost')) {
		// Developers will be coming from localhost. Allow them to specify the companyId via headers or query
		let companyId = req.headers['company-id'] ? Number(req.headers['company-id']) : -1;
		companyId = req.query.companyId ? Number(req.query.companyId) : companyId;
		if (companyId === -1) return next();

		let companyService = serviceFactory.get<CompanyService>('CompanyService');
		let company: Model.Company;
		try {
			company = await companyService.getCompanyById(companyId);
		} catch (e) {
			// Since this is before authentication we don't have res.sendError
			res.status(404).send('Company not found.');
			return;
		}

		req.companyId = company.id;
		next();
		return;
	}

	if (domainCompanyCache[host] === undefined) {
		const company: Model.Company = await serviceFactory.get<CompanyService>('CompanyService').getCompanyByUrl(host);
		domainCompanyCache[host] = company;
		if (!!company) req.companyId = company.id;
	} else if (domainCompanyCache[host]) {
		req.companyId = domainCompanyCache[host].id;
	}
	next();
}
