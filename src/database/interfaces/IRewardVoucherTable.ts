import ITable from '../ITable';
import { Claim } from '../objects/rewardVoucher.db';

export default interface IRewardVoucherTable extends ITable {
	deactivate(rewardId: number, code: string | number, companyId: number): Promise<Api.Reward.Voucher.Res.Delete>;
	createMany: (newVouchers: Partial<Model.RewardVoucher>[]) => Promise<Model.RewardVoucher[]>;
	claim(claimDetails: Claim): Promise<Api.Reward.Voucher.Res.Claim>;
}
