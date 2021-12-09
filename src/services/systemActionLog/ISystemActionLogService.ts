import IService from '../IService';
import { RsRequest } from '../../@types/expressCustom';

export interface FormatLogItem extends Api.SystemActionLog.Req.Create {
	method?: string;
	originalUrl?: string;
	metaData?: any;
}

export default interface ISystemActionLogService extends IService {
	create: (actionLogItem: Api.SystemActionLog.Req.Create) => Promise<Model.SystemActionLog>;

	formatApiLogItem: (req: RsRequest<any>) => Api.SystemActionLog.Req.Create;

	formatLogItem: ({
		userId,
		method,
		originalUrl,
		action,
		source,
		sourceId,
		...metaData
	}: FormatLogItem) => Api.SystemActionLog.Req.Create;

	systemLog: (logDetails: FormatLogItem) => Promise<void>;
}
