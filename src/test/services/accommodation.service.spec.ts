import chai from 'chai';
import dbSingleton from '../../database/dbSingleton';
import { ObjectUtils, WebUtils } from '../../utils/utils';
import serviceFactory from '../../services/serviceFactory';
import AccommodationService from '../../services/accommodation/accommodation.service';
import accommodationResource from '../resources/accommodation.service.resource';
import { ISabre } from '../../integrations/sabre/Sabre.interface';
import AccommodationType from '../../database/objects/accommodationType.db';
import Accommodation from '../../database/objects/accommodation.db';
import MediaService from '../../services/media/media.service';
import { CreateAccommodationCategory } from '../../database/objects/accommodationCategory.db';

describe('AccommodationService', function () {
	let accommodationService: AccommodationService;
	let mediaService: MediaService;
	let accommodationLayout: Api.AccommodationLayout.Details;
	let createdMedia: Model.Media;
	let createdAccommodationCategory: Api.AccommodationCategory.Details;
	before(async function () {
		accommodationService = serviceFactory.get<AccommodationService>('AccommodationService');
		mediaService = serviceFactory.get<MediaService>('MediaService');
	});
	after(async function () {
		const db = dbSingleton.get().accommodation;
		// Clean up test data
		await WebUtils.sleep(1000);
		await db.dbUtil.db.runQuery('DELETE FROM media WHERE id = ?;', [createdMedia.id]);
	});

	describe('Accommodation Type', function () {
		it('should sync and return Sabre Accommodation Types', async function () {
			const accommodationService: AccommodationService = serviceFactory.get('AccommodationService');
			const accommodationTypeTable: AccommodationType = dbSingleton.get().accommodationType;
			const accommodationTypes: ISabre.Model.AccommodationType[] = await accommodationService.syncAndGetIntegrationAccommodationTypes(
				accommodationResource.companyId
			);
			const localAccommodationTypes = await accommodationTypeTable.forCompany(accommodationResource.companyId);
			chai.expect(accommodationTypes).to.exist;
			chai.expect(accommodationTypes).to.be.an('array');
			chai.expect(accommodationTypes.length).to.be.greaterThan(0);
			chai.expect(accommodationTypes.length).at.most(localAccommodationTypes.length);
		});
	});

	describe('Accommodation', function () {
		it('should sync and return Sabre Accommodations', async function () {
			const accommodationService: AccommodationService = serviceFactory.get('AccommodationService');
			const accommodationTable: Accommodation = dbSingleton.get().accommodation;
			const accommodations: ISabre.Accommodation.Res.SyncSabreAccommodationList = await accommodationService.syncAndGetIntegrationAccommodations(
				accommodationResource.companyId
			);
			const localAccommodations: Model.Accommodation[] = await accommodationTable.allForCompany(
				accommodationResource.companyId
			);
			let accommodationCount = 0;
			for (let i in accommodations) {
				accommodationCount += accommodations[i].length;
			}
			chai.expect(accommodations).to.exist;
			chai.expect(localAccommodations.length).at.least(accommodationCount);
		});
	});

	describe('Create Layout', function () {
		it('should create an accommodation layout', async function () {
			const layoutMedia: Model.Media = await mediaService.create(accommodationResource.createMedia);
			const layoutToCreate = { ...accommodationResource.createLayout };
			layoutToCreate.mediaId = layoutMedia.id;
			createdMedia = layoutMedia;
			const createdLayout: Api.AccommodationLayout.Details = await accommodationService.createLayout(
				layoutToCreate
			);
			chai.expect(createdLayout).to.exist;
			accommodationLayout = createdLayout;
			chai.expect(createdLayout.media).to.be.an('object');
			chai.expect(createdLayout.rooms).to.be.an('array');
			chai.expect(createdLayout.title).to.equal(accommodationResource.createLayout.title);
			chai.expect(createdLayout.media.id).to.equal(createdMedia.id);
		});
	});

	describe('Create Accommodation Category', function () {
		it('should create an accommodation category', async function () {
			const categoryToCreate: CreateAccommodationCategory = {
				...accommodationResource.createCategory,
				mediaIds: [createdMedia]
			};
			const createdCategory: Api.AccommodationCategory.Details = await accommodationService.createCategory(
				categoryToCreate
			);
			chai.expect(createdCategory).to.exist;
			chai.expect(createdCategory).to.haveOwnProperty('media');
			chai.expect(createdCategory).to.haveOwnProperty('features');
			chai.expect(createdCategory.media).to.be.an('array');
			chai.expect(createdCategory.features).to.be.an('array');
			createdAccommodationCategory = createdCategory;
		});
	});

	describe('Update Layout', function () {
		it('should update the layout name', async function () {
			const layoutToUpdate = { ...accommodationResource.updateLayout };
			layoutToUpdate.mediaId = createdMedia.id;
			const updatedLayout: Api.AccommodationLayout.Details = await accommodationService.updateLayout({
				...layoutToUpdate,
				id: accommodationLayout.id
			});
			chai.expect(updatedLayout).to.exist;
			chai.expect(updatedLayout.title).to.equal(accommodationResource.updateLayout.title);
			chai.expect(updatedLayout.media).to.be.an('object');
			chai.expect(updatedLayout.media.id).to.equal(createdMedia.id);
		});
	});

	describe('Get Details', function () {
		it('should get the accommodation DETAILS object', async function () {
			const accommodationDetails: Api.Accommodation.Res.Details = await accommodationService.getById(
				accommodationResource.accommodationId
			);
			chai.expect(accommodationDetails).to.exist;
			chai.expect(accommodationDetails.media).to.be.an('array');
			chai.expect(accommodationDetails.layout).to.be.an('array');
			chai.expect(accommodationDetails.categories).to.be.an('array');
			chai.expect(accommodationDetails.amenities).to.be.an('array');
			chai.expect(accommodationDetails).to.haveOwnProperty('accommodationType');
			chai.expect(accommodationDetails).to.haveOwnProperty('accommodationTypeCode');
			chai.expect(accommodationDetails).to.haveOwnProperty('accommodationTypeDescription');
		});
		it('should get destination details by page', async function () {
			const pagedResults = await accommodationService.getByPage(
				accommodationResource.pagination,
				accommodationResource.sort,
				accommodationResource.filter
			);
			chai.expect(pagedResults).to.exist;
			chai.expect(pagedResults.data).to.be.an('array');
			chai.expect(pagedResults.total).to.be.a('number');
			chai.expect(pagedResults.data.length).to.equal(1);
			chai.expect(pagedResults.data[0]).to.haveOwnProperty('id');
			chai.expect(pagedResults.data[0].media).to.be.an('array');
			chai.expect(pagedResults.data[0].amenities).to.be.an('array');
			chai.expect(pagedResults.data[0].categories).to.be.an('array');
			chai.expect(pagedResults.data[0].layout).to.be.an('array');
		});
	});

	describe('Get Accommodation Layout', function () {
		it('should get an accommodation by id', async function () {
			const layoutDetails: Api.AccommodationLayout.Details = await accommodationService.getLayoutById(
				accommodationLayout.id
			);
			chai.expect(layoutDetails).to.exist;
			chai.expect(layoutDetails.media).to.exist;
			chai.expect(layoutDetails.rooms).to.be.an('array');
		});
		it('should get an accommodation by ids', async function () {
			const layoutDetails: Api.AccommodationLayout.Details[] = await accommodationService.getManyLayouts([
				accommodationLayout.id
			]);
			chai.expect(layoutDetails).to.exist;
			chai.expect(layoutDetails).to.be.an('array');
			chai.expect(layoutDetails[0].media).to.exist;
			chai.expect(layoutDetails[0].rooms).to.be.an('array');
		});
		it('should get accommodation layouts by page', async function () {
			const layoutByPage: Api.AccommodationLayout.Res.GetByPage = await accommodationService.getLayoutByPage(
				accommodationResource.pagination,
				accommodationResource.sort,
				accommodationResource.filter
			);
			chai.expect(layoutByPage).to.exist;
			chai.expect(layoutByPage.data).to.exist;
			chai.expect(layoutByPage.data).to.be.an('array');
			chai.expect(layoutByPage.total).to.exist;
			chai.expect(layoutByPage.total).to.be.a('number');
			chai.expect(layoutByPage.data[0]).to.haveOwnProperty('title');
		});
		it('should get layout rooms by layoutId', async function () {
			const layouts: Api.AccommodationLayout.Details[] = await accommodationService[
				'accommodationLayoutsForCompany'
			](accommodationResource.companyId);
			const randomIndex = WebUtils.randomNumberInRange(layouts.length);
			const layoutRooms: Model.AccommodationLayoutRoom[] = await accommodationService.getLayoutRoomsByLayoutId(
				layouts[randomIndex].id
			);
			chai.expect(layoutRooms).to.exist;
			chai.expect(layoutRooms).to.be.an('array');
			if (ObjectUtils.isArrayWithData(layoutRooms)) {
				for (let room of layoutRooms) {
					chai.expect(room).to.haveOwnProperty('title');
					chai.expect(room).to.haveOwnProperty('description');
				}
			}
		});
	});

	describe('Get Accommodation Category', function () {
		it('should get an accommodation category by id', async function () {
			const accommodationCategory: Api.AccommodationCategory.Details = await accommodationService.getCategoryById(
				accommodationResource.accommodationCategoryId
			);
			chai.expect(accommodationCategory).to.exist;
			chai.expect(accommodationCategory).to.haveOwnProperty('title');
			chai.expect(accommodationCategory).to.haveOwnProperty('description');
			chai.expect(accommodationCategory.features).to.be.an('array');
			chai.expect(accommodationCategory.media).to.be.an('array');
		});
		it('should get many accommodation categories by ids', async function () {
			const accommodationCategory: Api.AccommodationCategory.Details[] = await accommodationService.getManyCategoriesByIds(
				[accommodationResource.accommodationCategoryId],
				accommodationResource.companyId
			);
			chai.expect(accommodationCategory).to.exist;
			chai.expect(accommodationCategory).to.be.an('array').with.length.greaterThan(0);
			for (let category of accommodationCategory) {
				chai.expect(category).to.haveOwnProperty('title');
				chai.expect(category).to.haveOwnProperty('description');
				chai.expect(category.features).to.be.an('array');
				chai.expect(category.media).to.be.an('array');
			}
		});
		it('should get accommodationCategories for an accommodation', async function () {
			const accommodationCategories: Api.AccommodationCategory.Details[] = await accommodationService.getCategoryForAccommodation(
				accommodationResource.accommodationId
			);
			chai.expect(accommodationCategories).to.exist;
			for (let category of accommodationCategories) {
				chai.expect(category).to.haveOwnProperty('title');
				chai.expect(category).to.haveOwnProperty('description');
				chai.expect(category.features).to.be.an('array');
				chai.expect(category.media).to.be.an('array');
				chai.expect(category.accommodationId).to.equal(accommodationResource.accommodationId);
			}
		});
		it('should get accommodationCategories for a destination', async function () {
			const accommodationDetails: Api.Accommodation.Res.Details = await accommodationService.getById(
				accommodationResource.accommodationId,
				accommodationResource.companyId
			);
			const accommodationCategories: Api.AccommodationCategory.Details[] = await accommodationService.getCategoryForDestination(
				accommodationDetails.destinationId
			);
			chai.expect(accommodationCategories).to.exist;
			for (let category of accommodationCategories) {
				chai.expect(category).to.haveOwnProperty('title');
				chai.expect(category).to.haveOwnProperty('description');
				chai.expect(category.features).to.be.an('array');
				chai.expect(category.media).to.be.an('array');
				chai.expect(category.accommodationId).to.equal(accommodationDetails.destinationId);
			}
		});
	});

	describe('Update Accommodation Category', function () {
		it('should update an accommodation category', async function () {
			const updatedCategory: Api.AccommodationCategory.Details = await accommodationService.updateCategory(
				createdAccommodationCategory.id,
				{
					id: createdAccommodationCategory.id,
					companyId: accommodationResource.companyId,
					...accommodationResource.updateCategory
				}
			);
			chai.expect(updatedCategory).to.exist;
			chai.expect(updatedCategory).to.haveOwnProperty('title');
			chai.expect(updatedCategory.title).to.equal(accommodationResource.updateCategory.title);
			chai.expect(updatedCategory.features).to.be.an('array');
		});
	});

	describe('Delete accommodation Layout', function () {
		it('should delete the accommodation Layout by id', async function () {
			const deletedId: number = await accommodationService.deleteLayoutById(accommodationLayout.id);
			chai.expect(deletedId).to.equal(accommodationLayout.id);
		});
	});

	describe('Delete accommodation Category', function () {
		it('should delete the accommodation category by id', async function () {
			const deletedId: number = await accommodationService.deleteCategory(
				createdAccommodationCategory.id,
				accommodationResource.companyId
			);
			chai.expect(deletedId).to.equal(createdAccommodationCategory.id);
		});
	});
});
