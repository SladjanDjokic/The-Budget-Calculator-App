import chai from 'chai';
import CampaignService from '../../services/campaign/campaign.service';
import campaignResource from '../resources/campaign.service.resource';

describe('CampaignService', function () {
	let campaign: Api.Campaign.Detail;
	const campaignService = new CampaignService(campaignResource.campaignTable, campaignResource.campaignActionTable);

	describe('Create Campaigns', function () {
		it('should create a system campaign', async function () {
			const createdCampaign: Api.Campaign.Detail = await campaignService.create({
				...campaignResource.campaignCreate,
				companyId: campaignResource.companyId
			});
			chai.expect(createdCampaign).to.exist;
			chai.expect(createdCampaign).to.haveOwnProperty('id');
			campaign = createdCampaign;
		});
	});

	describe('Update Campaign', function () {
		it('should update a system campaign', async function () {
			const updatedCampaign: Api.Campaign.Detail = await campaignService.update(campaign.id, {
				...campaignResource.campaignUpdate,
				id: campaign.id,
				companyId: campaignResource.companyId
			});
			chai.expect(updatedCampaign).to.exist;
			chai.expect(updatedCampaign.description).to.not.equal(campaignResource.campaignCreate.description);
			chai.expect(updatedCampaign.pointValueMultiplier).to.equal(
				campaignResource.campaignUpdate.pointValueMultiplier
			);
		});
	});

	describe('Get Campaign', function () {
		it('should get an campaign by its id', async function () {
			const localCampaign: Api.Campaign.Detail = await campaignService.getById(
				campaign.id,
				campaignResource.companyId
			);
			chai.expect(localCampaign).to.exist;
		});
		it('should get an campaign by id list', async function () {
			const localCampaigns: Api.Campaign.Detail[] = await campaignService.getManyByIds(
				[campaign.id],
				campaignResource.companyId
			);
			chai.expect(localCampaigns).to.exist;
			chai.expect(localCampaigns).to.be.an('array');
			chai.expect(localCampaigns.length).to.equal(1);
		});
		it('should get campaigns by page', async function () {
			const pagedCampaigns: RedSky.RsPagedResponseData<Api.Campaign.Detail> = await campaignService.getByPage(
				campaignResource.pagination,
				campaignResource.sort,
				campaignResource.filter,
				campaignResource.companyId
			);
			chai.expect(pagedCampaigns).to.exist;
			chai.expect(pagedCampaigns).to.haveOwnProperty('data');
			chai.expect(pagedCampaigns).to.haveOwnProperty('total');
			chai.expect(pagedCampaigns.total).to.equal(1);
		});
	});

	describe('Delete Campaign', function () {
		it('should delete an campaign by id', async function () {
			const deletedCampaignId: number = await campaignService.delete(campaign.id, campaignResource.companyId);
			chai.expect(deletedCampaignId).to.exist;
			chai.expect(deletedCampaignId).to.equal(campaign.id);
		});
	});
});
