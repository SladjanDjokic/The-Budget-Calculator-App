import ITable from '../ITable';

export default interface IDestinationExperienceTable extends ITable {
	updateExperiences: (
		destinationId: number,
		experienceId: number,
		description: string,
		isHighlighted: 0 | 1
	) => Promise<number>;
}
