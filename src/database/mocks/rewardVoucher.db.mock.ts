import IRewardVoucherTable from '../interfaces/IRewardVoucherTable';
import { Claim } from '../objects/rewardVoucher.db';
import TableMock from './table.db.mock';

export default class RewardVoucherTableMock extends TableMock implements IRewardVoucherTable {
	columns: string[];
	createManyCalls: number = 0;
	lastId = 1;
	constructor(public readonly Vouchers: Model.RewardVoucher[]) {
		super();
	}

	async createMany(newVouchers: { rewardId: number; code: string }[]): Promise<Model.RewardVoucher[]> {
		this.createManyCalls++;
		const now = new Date();
		const createdVouchers: Model.RewardVoucher[] = newVouchers.map((v) => {
			return {
				...v,
				id: ++this.lastId,
				customerUserId: null,
				modifiedOn: now,
				redemptionInstructions: 'claim at front desk',
				isActive: 1,
				isRedeemed: 0,
				createdOn: now,
				redeemedOn: null
			};
		});
		this.Vouchers.push(...createdVouchers);
		return createdVouchers;
	}
	async deactivate(rewardId: number, code: string, companyId: number): Promise<Api.Reward.Voucher.Res.Delete> {
		const index = this.Vouchers.findIndex((v) => v.rewardId === rewardId && v.code === code);
		this.Vouchers[index].isActive = 0;
		return { rewardId, code };
	}

	async getByPage(
		pagination: RedSky.PagePagination,
		sort: RedSky.SortQuery,
		filter: RedSky.FilterQuery
	): Promise<RedSky.RsPagedResponseData<Api.Reward.Voucher.Res.Get[]>> {
		return { data: this.Vouchers, total: this.Vouchers.length };
	}

	async get(rewardId: number, code: string): Promise<Api.Reward.Voucher.Res.Claim> {
		return this.Vouchers.find((voucher) => {
			return voucher.rewardId === rewardId && voucher.code === code;
		});
	}

	async claim(claimDetails: Claim): Promise<Api.Reward.Voucher.Res.Claim> {
		for (let voucher of this.Vouchers) {
			if (voucher.rewardId !== claimDetails.rewardId) continue;
			if (voucher.code !== claimDetails.code) continue;
			voucher.customerUserId = claimDetails.user.id;
			return this.get(claimDetails.rewardId, claimDetails.code);
		}
	}

	create: (tableObj: any) => Promise<any>;
	getById: (objId: number, companyId?: number) => Promise<any>;
	getManyByIds: (objIds: readonly number[], companyId?: number) => Promise<any>;
	update: (id: number, tableObj: any) => Promise<any>;
	updateMany: (ids: number[], tableObj: any) => Promise<any>;
	delete: null;
	deleteMany: null;
}
