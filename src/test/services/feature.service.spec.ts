import chai from 'chai';
import dbSingleton from '../../database/dbSingleton';
import { WebUtils } from '../../utils/utils';
import serviceFactory from '../../services/serviceFactory';
import FeatureService from '../../services/feature/feature.service';
import featureResource from '../resources/feature.service.resource';
import MediaService from '../../services/media/media.service';

describe('FeatureService', function () {
	let featureService: FeatureService;
	let mediaService: MediaService;
	let createdFeature: Api.Feature.Details;
	before(async function () {
		featureService = serviceFactory.get<FeatureService>('FeatureService');
		mediaService = serviceFactory.get<MediaService>('MediaService');
	});

	describe('Create a feature', function () {
		it('should create a feature', async function () {
			const companyMedia: Model.Media[] = await mediaService['getForCompany'](featureResource.companyId);
			if (!companyMedia) return;
			featureResource.featureCreate.mediaIds[0].id = companyMedia[0].id;
			const featureDetails: Api.Feature.Details = await featureService.create(featureResource.featureCreate);
			chai.expect(featureDetails).to.exist;
			chai.expect(featureDetails.media).to.be.an('array');
			chai.expect(featureDetails).to.haveOwnProperty('title');
			chai.expect(featureDetails).to.haveOwnProperty('description');
			chai.expect(featureDetails).to.haveOwnProperty('icon');
			chai.expect(featureDetails).to.haveOwnProperty('isActive');
			chai.expect(featureDetails).to.haveOwnProperty('isCarousel');
			createdFeature = featureDetails;
		});
	});

	describe('Get a feature', function () {
		it('should get a feature and details', async function () {
			const featureDetails: Api.Feature.Details = await featureService.getById(createdFeature.id);
			chai.expect(featureDetails).to.exist;
			chai.expect(featureDetails.media).to.be.an('array');
			chai.expect(featureDetails).to.haveOwnProperty('title');
			chai.expect(featureDetails).to.haveOwnProperty('description');
			chai.expect(featureDetails).to.haveOwnProperty('icon');
			chai.expect(featureDetails).to.haveOwnProperty('isActive');
			chai.expect(featureDetails).to.haveOwnProperty('isCarousel');
		});
		it('should get many features and details by ids', async function () {
			const companyMediaList = await mediaService['getForCompany'](featureResource.companyId);
			const idsList = [createdFeature.id];
			for (let i = 0; i < 4; i++) {
				idsList.push(companyMediaList[i].id);
			}
			const featureDetails = await featureService.getManyByIds(idsList);
			chai.expect(featureDetails).to.exist;
			chai.expect(featureDetails.length).to.lessThan(idsList.length + 1);
			for (let feature of featureDetails) {
				chai.expect(idsList).to.include(feature.id);
			}
		});
		it('should get features by page', async function () {
			const featureByPage: Api.Feature.Res.GetByPage = await featureService.getByPage(
				featureResource.pagination,
				featureResource.sort,
				featureResource.filter,
				featureResource.companyId
			);
			chai.expect(featureByPage).to.exist;
			chai.expect(featureByPage.data).to.exist;
			chai.expect(featureByPage.data).to.be.an('array');
			chai.expect(featureByPage.total).to.exist;
			chai.expect(featureByPage.total).to.be.a('number');
			chai.expect(featureByPage.data[0]).to.haveOwnProperty('id');
			chai.expect(featureByPage.data[0]).to.haveOwnProperty('title');
			chai.expect(featureByPage.data[0]).to.haveOwnProperty('description');
			chai.expect(featureByPage.data[0]).to.haveOwnProperty('icon');
			chai.expect(featureByPage.data[0]).to.haveOwnProperty('isActive');
			chai.expect(featureByPage.data[0]).to.haveOwnProperty('isCarousel');
			chai.expect(featureByPage.data[0].media).to.be.an('array');
		});
	});

	describe('Update a feature', function () {
		it('should update a feature and details', async function () {
			featureResource.featureUpdate.id = createdFeature.id;
			const featureDetails: Api.Feature.Details = await featureService.update(
				createdFeature.id,
				featureResource.featureUpdate
			);
			chai.expect(featureDetails).to.exist;
			chai.expect(featureDetails.media).to.be.an('array');
			chai.expect(featureDetails).to.haveOwnProperty('title');
			chai.expect(featureDetails).to.haveOwnProperty('description');
			chai.expect(featureDetails).to.haveOwnProperty('icon');
			chai.expect(featureDetails).to.haveOwnProperty('isActive');
			chai.expect(featureDetails).to.haveOwnProperty('isCarousel');
		});
		it('should update a features media items', async function () {
			const companyMedia: Model.Media[] = await mediaService['getForCompany'](featureResource.companyId);
			if (!companyMedia) return;
			featureResource.featureMediaUpdate.id = createdFeature.id;
			featureResource.featureMediaUpdate.mediaIds[0].id = companyMedia[0].id;
			const featureMediaUpdateIsPrimary = featureResource.featureMediaUpdate.mediaIds[0].isPrimary;
			const featureDetails: Api.Feature.Details = await featureService.update(
				createdFeature.id,
				featureResource.featureMediaUpdate
			);
			chai.expect(featureDetails).to.exist;
			chai.expect(featureDetails.media).to.exist;
			chai.expect(featureDetails.media[0].isPrimary).to.equal(featureMediaUpdateIsPrimary);
		});
	});

	describe('Delete a feature', function () {
		it('should delete a feature by its id', async function () {
			const deletedFeature: number = await featureService.delete(featureResource.companyId, createdFeature.id);
			chai.expect(deletedFeature).to.exist;
			chai.expect(deletedFeature).to.equal(createdFeature.id);
		});
		it('should fail to allow deleting a feature from a different company', async function () {
			try {
				await featureService.delete(featureResource.companyId + 1, createdFeature.id);
			} catch (e) {
				chai.expect(e.err).to.exist;
				chai.expect(e.status).to.exist;
				chai.expect(e.status).to.equal(403);
				chai.expect(e.err).to.equal('FORBIDDEN');
			}
		});
	});
});
