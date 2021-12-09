import Table from '../Table';
import { RsError } from '../../utils/errors';

export default class MediaMap extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async create(tableObj): Promise<boolean> {
		tableObj = Table.columnObjectStringify(tableObj);
		try {
			await this.db.runQuery(`INSERT INTO mediaMap SET ?;`, [tableObj]);
			return true;
		} catch (e) {
			if (e.err && e.err.code === 'ER_DUP_ENTRY') throw new RsError('DUPLICATE', e.err.sqlMessage);
			throw new RsError('UNKNOWN_ERROR', e);
		}
	}

	async getByMediaId(objId: number): Promise<any> {
		let result = await this.db.queryOne(`SELECT  *  FROM \`${this.tableName}\` WHERE mediaId=?;`, [objId]);
		return result;
	}

	async delete(mediaId: number): Promise<null> {
		await this.db.runQuery(`DELETE FROM mediaMap WHERE mediaId=?;`, [mediaId]);
		return;
	}

	async getImageMapsByProductId(productId: number): Promise<Model.MediaMap[]> {
		return await this.db.runQuery(`SELECT  *  FROM mediaMap WHERE productId=?;`, [productId]);
	}

	async deleteImagesByProductId(productId: number) {
		let mediaMaps = await this.getImageMapsByProductId(productId);

		await this.db.runQuery(`DELETE FROM mediaMap WHERE productId=?;`, [productId]);

		for (let i = 0; i < mediaMaps.length; i++) {
			await this.db.runQuery(`DELETE FROM media WHERE id=?;`, [mediaMaps[i].mediaId]);
		}
	}

	async getByKeyId(mapKey: { [keyId: string]: number }) {
		return await this.db.runQuery('SELECT * FROM mediaMap WHERE ?;', [mapKey]);
	}
}

export const mediaMap = (dbArgs) => {
	dbArgs.tableName = 'mediaMap';
	return new MediaMap(dbArgs);
};
