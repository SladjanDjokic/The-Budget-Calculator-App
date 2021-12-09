import IServiceKeyTable, { ServiceKeyAndDetails, ServiceKeysAndDetails } from '../interfaces/IServiceKeyTable';
import Table from '../Table';
import mysql from 'mysql';

export default class ServiceKey extends Table implements IServiceKeyTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	getServiceKeyAndCompanyDetails(
		serviceType: Model.ServiceKeyType,
		companyId?: number
	): Promise<ServiceKeyAndDetails> {
		const companyIdQuery = companyId ? mysql.format('company.id=? AND', [companyId]) : '';
		return this.db.queryOne(
			`SELECT
				company.*,
				csk.serviceName,
				csk.serviceType,
				csk.serviceKey
			FROM company
				JOIN serviceKey csk ON company.id=csk.companyId
			WHERE ${companyIdQuery} csk.serviceType=? LIMIT 1;`,
			[serviceType]
		);
	}

	getServiceKeysAndCompanyDetails(
		serviceType: Model.ServiceKeyType,
		companyId?: number
	): Promise<ServiceKeysAndDetails> {
		const companyIdQuery = Table.buildCompanyIdQuery(companyId, 'csk');
		return this.db.queryOne(
			`SELECT
			    company.*,
			    IFNULL(
					CONCAT(
						'[',
						GROUP_CONCAT(
							CONCAT(
								'{"serviceName":"',csk.serviceName,'",
								"serviceType":"',csk.serviceType,'",
								"serviceKey":',csk.serviceKey,'}'
							)
						),
						']'
					),
					'[]'
				) AS services
			FROM company
			         JOIN serviceKey csk ON company.id=csk.companyId
			WHERE csk.serviceType=?
				AND ${companyIdQuery}
			GROUP BY company.id;`,
			[serviceType]
		);
	}

	delete: null;
	deleteMany: null;
}

export const serviceKey = (dbArgs) => {
	dbArgs.tableName = 'serviceKey';
	return new ServiceKey(dbArgs);
};
