import Table from '../Table';
import IDestinationExperienceTable from '../interfaces/IDestinationExperienceTable';

export default class DestinationExperience extends Table implements IDestinationExperienceTable {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async updateExperiences(
		destinationId: number,
		experienceId: number,
		description: string,
		isHighlighted: 0 | 1
	): Promise<number> {
		const createResponse = await this.db.runQuery(
			`
                INSERT INTO destinationExperience (destinationId, experienceId, description, isHighlighted) 
                        VALUES (? , ?, ?, ?) 
                        ON DUPLICATE KEY UPDATE description=VALUES(description), isHighlighted=VALUES(isHighlighted);`,

			[destinationId, experienceId, description, isHighlighted]
		);
		return createResponse.insertId;
	}
}

export const destinationExperience = (dbArgs) => {
	dbArgs.tableName = 'destinationExperience';
	return new DestinationExperience(dbArgs);
};
