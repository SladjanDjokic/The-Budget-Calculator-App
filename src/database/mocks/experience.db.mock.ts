import TableMock from './table.db.mock';
import IExperienceTable from '../interfaces/IExperienceTable';

export default class ExperienceTableMock extends TableMock implements IExperienceTable {
	experiences: Api.Experience.Res.Get[] = [];
	lastId: number = 0;

	constructor(prefillData?: Api.Experience.Res.Get[]) {
		super();
		if (prefillData) this.experiences = prefillData;
	}

	async getAllExperiences(): Promise<Api.Experience.Res.Get[]> {
		return this.experiences;
	}
}
