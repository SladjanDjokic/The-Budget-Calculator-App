import ExperienceTableMock from '../../database/mocks/experience.db.mock';
import DestinationExperienceTableMock from '../../database/mocks/destinationExperience.db.mock';

const experiences: Api.Experience.Res.Get[] = [
	{
		id: 1,
		title: 'test 1',
		icon: 'test-icon-1'
	},
	{
		id: 2,
		title: 'test 2',
		icon: 'test-icon-2'
	},
	{
		id: 3,
		title: 'test 3',
		icon: 'test-icon-3'
	}
];

const destinationExperiences: Model.DestinationExperience[] = experiences.map((experience, index) => {
	return {
		id: index + 1,
		destinationId: 1,
		experienceId: experience.id,
		description: `tester description ${index}`,
		isHighlighted: 1
	};
});

const experienceTableMock = new ExperienceTableMock(experiences);
const destinationExperienceTableMock = new DestinationExperienceTableMock(destinationExperiences);

const experienceResource = {
	experienceTableMock,
	destinationExperienceTableMock
};

export default experienceResource;
