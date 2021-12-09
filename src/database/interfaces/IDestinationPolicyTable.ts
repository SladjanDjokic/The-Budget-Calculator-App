import ITable from '../ITable';

export default interface IDestinationPolicyTable extends ITable {
	getForCompany: (companyId: number) => Promise<Model.DestinationPolicy[]>;
	getForDestination: (destinationId: number, companyId: number) => Promise<Model.DestinationPolicy[]>;
	get: (
		destinationId: number,
		companyId: number,
		policyType: Model.DestinationPolicyType
	) => Promise<Model.DestinationPolicy>;
	updatePolicy: (policy: Model.DestinationPolicy) => Promise<Model.DestinationPolicy>;
	deletePolicy: (
		policy: Model.DestinationPolicy
	) => Promise<Pick<Model.DestinationPolicy, 'destinationId' | 'policyType'>>;

	getById: null;
	getManyByIds: null;
	update: null;
	delete: null;
}
