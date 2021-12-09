import ITable from '../ITable';

export default interface IRewardCategoryMapTable extends ITable {
	deleteByRewardId: (rewardId: number) => Promise<void>;
	create: (tableObj: Model.RewardCategoryMap) => Promise<boolean>;
}
