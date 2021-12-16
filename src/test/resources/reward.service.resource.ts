import RewardCategoryTableMock from '../../database/mocks/rewardCategory.db.mock';
import RewardTableMock from '../../database/mocks/reward.db.mock';
import MediaServiceMock from '../../services/media/media.service.mock';
import RewardCategoryMapTableMock from '../../database/mocks/rewardCategoryMap.db.mock';
import RewardVoucherTableMock from '../../database/mocks/rewardVoucher.db.mock';
import { DateUtils } from '../../utils/utils';
import { Claim } from '../../database/objects/rewardVoucher.db';
import UserPointServiceMock from '../../services/userPoint/userPoint.service.mock';
import EmailServiceMock from '../../services/email/email.service.mock';
import UserResource from './user.service.resource';
import OrdersServiceMock from '../../services/order/orders.service.mock';
import UserPointTableMock from '../../database/mocks/userPoint.db.mock';
import UserService from '../../services/user/user.service';
import UserPermissionTableMock from '../../database/mocks/userPermission.db.mock';
import UserCompletedCampaignTableMock from '../../database/mocks/userCompletedCampaign.db.mock';
import CampaignTableMock from '../../database/mocks/campaign.db.mock';
import RedisClientMock from '../../integrations/redis/redisClientMock';
import UserActionTableMock from '../../database/mocks/userAction.db.mock';
import UserTableMock from '../../database/mocks/user.db.mock';
import UserAddressTableMock from '../../database/mocks/userAddress.db.mock';
import CompanyServiceMock from '../../services/company/company.service.mock';
import TierService from '../../services/tier/tier.service';
import TierTableMock from '../../database/mocks/tier.db.mock';
import TierFeatureTableMock from '../../database/mocks/tierFeature.db.mock';
import { ServiceName } from '../../services/serviceFactory';
import { Service } from '../../services/Service';
import RewardService from '../../services/reward/reward.service';
import TierMultiplierTableMock from '../../database/mocks/tierMultiplier.db.mock';

export default class RewardServiceResource {
	readonly companyId: number;
	readonly otherCompanyId: number;
	readonly rewardTable: RewardTableMock;
	readonly categoryTable: RewardCategoryTableMock;
	readonly newCategory: Api.Reward.Category.Req.Create;
	readonly pagination: RedSky.PagePagination;
	readonly sort: RedSky.SortQuery;
	readonly filter: RedSky.FilterQuery;
	readonly newReward: Api.Reward.Req.Create;
	readonly startingMediaIds: number[];
	readonly newMediaIds: number[];
	readonly emailService: EmailServiceMock;
	readonly mediaService: MediaServiceMock;
	readonly rewardCategoryMapTable: RewardCategoryMapTableMock;
	readonly rewardVoucherTable: RewardVoucherTableMock;
	readonly newVoucherCodes: string[];
	readonly existingVoucher: Model.RewardVoucher;
	readonly otherFilters: {
		vendorBrandIds: number[];
		vendorDestinationIds: number[];
		categories: number[];
		pointCostMax: number;
		pointCostMin: number;
	};
	readonly claim: Claim;
	readonly userPointService: UserPointServiceMock;
	readonly orderService: OrdersServiceMock;
	readonly userResource: UserResource;
	services: Partial<Record<ServiceName, Service>>;

	constructor() {
		const now = DateUtils.dbNow();
		this.companyId = 1;
		this.services = {};
		this.userResource = new UserResource();
		this.otherCompanyId = this.companyId + 99;
		this.otherFilters = {
			vendorBrandIds: [1],
			vendorDestinationIds: [1, 2],
			categories: [1, 5],
			pointCostMax: 5000,
			pointCostMin: 1000
		};
		this.categoryTable = new RewardCategoryTableMock([
			{
				id: 1,
				name: 'Stuff',
				isActive: 1,
				isFeatured: 0,
				createdOn: now,
				modifiedOn: now,
				media: []
			},
			{
				id: 2,
				name: 'Wrong Stuff',
				isActive: 1,
				isFeatured: 0,
				createdOn: now,
				modifiedOn: now,
				media: []
			},
			{
				id: 3,
				name: 'Unassigned Stuff',
				isActive: 1,
				isFeatured: 0,
				createdOn: now,
				modifiedOn: now,
				media: []
			},
			{
				id: 4,
				name: 'Inactive Stuff',
				isActive: 1,
				isFeatured: 0,
				createdOn: now,
				modifiedOn: now,
				media: []
			},
			{
				id: 5,
				name: 'Other Active Stuff',
				isActive: 1,
				isFeatured: 0,
				createdOn: now,
				modifiedOn: now,
				media: []
			}
		]);
		this.rewardCategoryMapTable = new RewardCategoryMapTableMock([
			{
				rewardId: 1,
				categoryId: 1
			}
		]);
		this.rewardTable = new RewardTableMock(
			[
				{
					id: 1,
					companyId: this.companyId,
					destinationId: 1,
					brandId: null,
					createdOn: now,
					modifiedOn: now,
					description: "Here's a really long, wordy description of a really simple thing.",
					redemptionInstructions: 'redeem your stuff',
					name: 'Thing',
					pointCost: this.otherFilters.pointCostMax + 500,
					monetaryValueInCents: 0,
					upc: '1234',
					isActive: 1
				},
				{
					id: 2,
					companyId: this.otherCompanyId,
					destinationId: 2,
					brandId: null,
					createdOn: now,
					modifiedOn: now,
					description: 'This Reward should never be returned.',
					redemptionInstructions: 'redeem your stuff',
					name: 'Wrong Thing',
					pointCost: 1000,
					monetaryValueInCents: 0,
					upc: '1255',
					isActive: 1
				},
				{
					id: 3,
					companyId: this.companyId,
					destinationId: 1,
					brandId: null,
					createdOn: now,
					modifiedOn: now,
					description: "Here's an thing that's not currently available.",
					redemptionInstructions: 'redeem your stuff',
					name: 'Inactive Thing',
					pointCost: 1000,
					monetaryValueInCents: 0,
					upc: '147',
					isActive: 0
				},
				{
					id: 4,
					companyId: this.companyId,
					destinationId: null,
					brandId: 1,
					createdOn: now,
					modifiedOn: now,
					description: "Here's another valid thing.",
					redemptionInstructions: 'redeem your stuff',
					name: 'Other Thing',
					pointCost: this.otherFilters.pointCostMin - 10,
					monetaryValueInCents: 0,
					upc: '852',
					isActive: 1
				}
			],
			this.rewardCategoryMapTable.Maps
		);
		this.existingVoucher = {
			id: Date.now(),
			rewardId: this.rewardTable.Rewards[0].id,
			code: 'existingVoucher',
			customerUserId: null,
			isActive: 1,
			isRedeemed: 0,
			createdOn: now,
			modifiedOn: now,
			redeemedOn: null
		};
		this.rewardVoucherTable = new RewardVoucherTableMock([this.existingVoucher]);
		this.startingMediaIds = [1, 2, 3, 4, 5]; //arbitrary numbers, no significance
		this.newMediaIds = [3, 4, 5, 6, 7]; //arbitrary numbers, no significance
		const tiers: { [key: number]: Model.Tier } = {
			1: {
				id: 525,
				name: 'Bronze',
				description: '',
				createdOn: now,
				modifiedOn: now,
				isActive: 1,
				threshold: 0,
				isAnnualRate: 0
			}
		};
		this.newReward = {
			name: 'New Reward',
			description: 'A longer description of the same thing',
			monetaryValueInCents: 100,
			destinationId: 1,
			brandId: null,
			pointCost: 10000,
			upc: '1',
			mediaDetails: [
				{
					id: 100,
					isPrimary: 1
				},
				{
					id: 200,
					isPrimary: 0
				}
			],
			categoryIds: [1]
		};

		this.newCategory = {
			name: 'New Category Name',
			isActive: 1,
			isFeatured: 0,
			mediaDetails: [
				{
					id: 100,
					isPrimary: 1
				},
				{
					id: 200,
					isPrimary: 0
				}
			]
		};

		this.newVoucherCodes = ['voucher1', 'voucher2', 'voucher3'];

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

		this.claim = {
			rewardId: this.rewardTable.Rewards[0].id,
			pointCost: this.rewardTable.Rewards[0].pointCost,
			code: 'existingVoucher',
			user: this.userResource.existingUser
		};
		const tierMultiplierTable = new TierMultiplierTableMock();
		this.services['TierService'] = new TierService(
			new TierTableMock(tiers, [], tierMultiplierTable),
			new TierFeatureTableMock({}),
			tierMultiplierTable
		);
		this.services['CompanyService'] = new CompanyServiceMock({
			companyId: this.companyId,
			ap2FactorLoginTimeoutDays: 2,
			ap2FactorLoginVerificationTimeoutHours: 2,
			allowCashBooking: 1,
			allowPointBooking: 1,
			customPages: {},
			unauthorizedPages: []
		});
		this.services['EmailService'] = new EmailServiceMock();
		this.services['UserPointService'] = new UserPointServiceMock(new UserPointTableMock());
		this.services['OrdersService'] = new OrdersServiceMock();
		this.services['MediaService'] = new MediaServiceMock(this.startingMediaIds);
		this.services['UserService'] = new UserService(
			new UserTableMock(
				[this.userResource.existingUser],
				[],
				new UserPermissionTableMock(),
				new UserAddressTableMock()
			),
			new UserAddressTableMock(),
			new UserPermissionTableMock(),
			new UserCompletedCampaignTableMock([], new CampaignTableMock()),
			new RedisClientMock(),
			new UserActionTableMock()
		);
		this.services['RewardService'] = new RewardService(
			this.rewardTable,
			this.categoryTable,
			this.rewardCategoryMapTable,
			this.rewardVoucherTable
		);
		for (let key in this.services) {
			this.services[key].start(this.services);
		}
	}
}
