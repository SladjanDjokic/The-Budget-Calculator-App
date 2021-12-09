import TableMock from './table.db.mock';
import IDestinationExperienceTable from '../interfaces/IDestinationExperienceTable';

export default class DestinationExperienceTableMock extends TableMock implements IDestinationExperienceTable {
	experiences: Model.DestinationExperience[] = [];
	lastId: number = 0;

	constructor(prefillData?: Model.DestinationExperience[]) {
		super();
		if (prefillData) {
			this.experiences = prefillData;
			this.lastId = Math.max(...prefillData.map((data) => data.id));
		}
	}

	async updateExperiences(
		destinationId: number,
		experienceId: number,
		description: string,
		isHighlighted: 0 | 1
	): Promise<number> {
		let createdExperience: Model.DestinationExperience;
		createdExperience = this.experiences.find(
			(experience) => experience.destinationId === destinationId && experience.experienceId === experienceId
		);
		if (createdExperience) createdExperience.description = description;
		else {
			createdExperience = { id: ++this.lastId, destinationId, experienceId, description, isHighlighted };
			this.experiences.push(createdExperience);
		}
		return createdExperience.id;
	}
}
