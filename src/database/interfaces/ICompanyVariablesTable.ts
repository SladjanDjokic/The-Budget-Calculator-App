import ITable from '../ITable';

export default interface ICompanyVariablesTable extends ITable {
	getByCompanyId: (companyId: number) => Promise<Model.CompanyVariables>;
	update: (
		companyId: number,
		variablesToUpdate: Omit<Partial<Model.CompanyVariables>, 'companyId'>
	) => Promise<boolean>;
}
