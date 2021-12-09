import ITable from '../ITable';

export default interface IExperienceTable extends ITable {
	getAllExperiences: () => Promise<Api.Experience.Res.Get[]>;
}
