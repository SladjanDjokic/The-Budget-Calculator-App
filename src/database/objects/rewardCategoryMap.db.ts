import logger from '../../utils/logger';
import IRewardCategoryMapTable from '../interfaces/IRewardCategoryMapTable';
import Table from '../Table';

export default class RewardCategoryMapTable extends Table implements IRewardCategoryMapTable {
	async create(tableObj: Model.RewardCategoryMap): Promise<boolean> {
		try {
			await this.db.runQuery(`INSERT INTO ${this.tableName} SET ?`, [tableObj]);
			return true;
		} catch (e) {
			logger.error(e);
			return false;
		}
	}

	async deleteByRewardId(rewardId: number): Promise<void> {
		await this.db.runQuery(`DELETE FROM \`${this.tableName}\` WHERE \`rewardId\`=?;`, [rewardId]);
	}
}

export const rewardCategoryMap = (dbArgs) => {
	dbArgs.tableName = 'rewardCategoryMap';
	return new RewardCategoryMapTable(dbArgs);
};
