import { Service } from '../Service';
import dbSingleton from '../../database/dbSingleton';
import SystemActionLog from '../../database/objects/systemActionLog.db';
import { RsRequest } from '../../@types/expressCustom';
import { FormatLogItem } from './ISystemActionLogService';
import { ServiceName } from '../serviceFactory';

export default class SystemActionLogService extends Service {
	systemActionLogTable: SystemActionLog = dbSingleton.get().systemActionLog;
	constructor() {
		super();
	}
	start(services: Partial<Record<ServiceName, Service>>) {}

	create(actionLogItem: Api.SystemActionLog.Req.Create) {
		return this.systemActionLogTable.create(actionLogItem);
	}

	formatApiLogItem(req: RsRequest<any>): Api.SystemActionLog.Req.Create {
		return this.formatLogItem({
			userId: req?.user?.id,
			method: req.method,
			action: req.data?.action,
			source: req.data?.source,
			originalUrl: req.originalUrl,
			metaData: req.data
		});
	}

	formatLogItem({
		userId,
		method = '',
		originalUrl = '',
		action,
		source,
		sourceId,
		...metaData
	}: FormatLogItem): Api.SystemActionLog.Req.Create {
		return {
			userId,
			action,
			source,
			sourceId,
			metaData: JSON.stringify({ ...metaData, method, originalUrl })
		};
	}

	async systemLog(logDetails: FormatLogItem): Promise<void> {
		const logItem: Api.SystemActionLog.Req.Create = this.formatLogItem(logDetails);
		return await this.create(logItem);
	}
}
