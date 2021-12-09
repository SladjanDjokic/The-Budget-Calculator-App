import Table from '../Table';
import IExperienceTable from '../interfaces/IExperienceTable';

export default class Experience extends Table implements IExperienceTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getAllExperiences(): Promise<Api.Experience.Res.Get[]> {
		return this.db.runQuery('SELECT * FROM experience;');
	}
}

export const experience = (dbArgs) => {
	dbArgs.tableName = 'experience';
	return new Experience(dbArgs);
};
