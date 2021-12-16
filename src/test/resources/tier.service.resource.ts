import { DateUtils } from '../../utils/utils';
import TierTableMock from '../../database/mocks/tier.db.mock';
import TierFeatureTableMock from '../../database/mocks/tierFeature.db.mock';
import MediaServiceMock from '../../services/media/media.service.mock';
import TierMultiplierTableMock from '../../database/mocks/tierMultiplier.db.mock';

export default class TierResource {
	adminUserId: number = 1;
	existingTier: Model.Tier;
	tierTable: TierTableMock;
	existingFeature: Model.TierFeature;
	existingMultiplier: Model.TierMultiplier;
	tierFeatureTable: TierFeatureTableMock;
	tierMultiplierTable: TierMultiplierTableMock;
	tierCreate: Api.Tier.Req.Create;
	tierUpdate: Api.Tier.Req.Update;
	pagination: RedSky.PagePagination;
	sort: RedSky.SortQuery;
	filter: RedSky.FilterQuery;
	tierFeatureName = 'Test Feature';
	mediaService: MediaServiceMock;
	startingMediaIds: number[];
	newMediaIds: number[];
	mediaDetails: Api.MediaDetails[];

	constructor() {
		this.tierCreate = {
			name: 'Test Tier',
			accrualRate: 1.25,
			threshold: 9999999999,
			featureIds: []
		};

		this.tierUpdate = {
			id: 0,
			name: 'Test Tier Updated'
		};

		this.pagination = {
			page: 1,
			perPage: 1
		};

		this.sort = {
			field: 'id',
			order: 'ASC'
		};

		this.filter = {
			matchType: 'exact',
			searchTerm: [{ column: 'id', value: 0 }]
		};

		this.existingTier = {
			id: 1,
			name: 'test tier',
			description: 'test tier description',
			isActive: 1,
			isAnnualRate: 0,
			threshold: 1000,
			createdOn: DateUtils.addDays(DateUtils.dbNow(), -4),
			modifiedOn: DateUtils.addDays(DateUtils.dbNow(), -4)
		};

		this.existingFeature = {
			id: 1,
			name: 'test feature',
			createdOn: DateUtils.addDays(DateUtils.dbNow(), -4),
			modifiedOn: DateUtils.addDays(DateUtils.dbNow(), -4)
		};

		const existingMap: Model.TierFeatureMap = {
			tierId: this.existingTier.id,
			TierFeatureId: this.existingFeature.id
		};

		this.existingMultiplier = {
			id: 1,
			tierId: this.existingTier.id,
			creatingUserId: this.adminUserId,
			multiplier: 1.25,
			createdOn: new Date()
		};

		this.tierMultiplierTable = new TierMultiplierTableMock([this.existingMultiplier]);
		this.tierTable = new TierTableMock(
			{ [this.existingTier.id]: this.existingTier },
			[existingMap],
			this.tierMultiplierTable
		);
		this.tierFeatureTable = new TierFeatureTableMock({ [this.existingFeature.id]: this.existingFeature });
		this.startingMediaIds = [1, 2, 3, 4, 5]; //arbitrary numbers, no significance
		this.newMediaIds = [3, 4, 5, 6, 7]; //arbitrary numbers, no significance
		this.mediaService = new MediaServiceMock(this.startingMediaIds);
		this.mediaDetails = [
			{
				id: 100,
				isPrimary: 1
			},
			{
				id: 200,
				isPrimary: 0
			}
		];
	}
}
