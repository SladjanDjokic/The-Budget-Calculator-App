import { expect } from 'chai';
import ExperienceService from '../../services/experience/experience.service';
import experienceResource from '../resources/experience.service.resource';

describe('Experience Service', function () {
	let experienceService: ExperienceService;

	before(() => {
		experienceService = new ExperienceService(
			experienceResource.experienceTableMock,
			experienceResource.destinationExperienceTableMock
		);
	});

	describe('Get All Experiences', function () {
		it('Should get a list of all experiences', async function () {
			const experiences = await experienceService.getAllExperiences();
			expect(experiences).to.exist;
			expect(experiences).to.be.an('array').with.length.greaterThan(0);
			for (let experience of experiences) {
				expect(experience.id, 'Invalid experience ID').to.be.greaterThan(0);
				expect(experience.title, 'Invalid experience title')
					.to.be.a('string')
					.with.length.greaterThan(0, 'No title supplied');
			}
		});
	});
});
