import Table from '../Table';

export default class EmailTemplate extends Table {
	constructor(dbArgs) {
		super(dbArgs);
	}

	async getTemplateById(templateId: number) {
		return await this.db.queryOne('SELECT * from emailTemplate WHERE id=?;', [templateId]);
	}

	async getLatestTemplateByType(type: string) {
		return await this.db.queryOne('SELECT * FROM emailTemplate WHERE type=? order by createdOn desc limit 1;', [
			type
		]);
	}
}

export const emailTemplate = (dbArgs) => {
	dbArgs.tableName = 'emailTemplate';
	return new EmailTemplate(dbArgs);
};
