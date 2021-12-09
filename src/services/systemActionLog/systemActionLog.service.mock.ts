import ISystemActionLogService, { FormatLogItem } from './ISystemActionLogService';
import { RsRequest } from '../../@types/expressCustom';

export default class SystemActionLogServiceMock implements ISystemActionLogService {
	constructor() {}
	start() {}

	create(actionLogItem: Api.SystemActionLog.Req.Create): Promise<Model.SystemActionLog> {
		return;
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

	async systemLog(logDetails: FormatLogItem): Promise<void> {}
}
