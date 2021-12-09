import { DateUtils, ObjectUtils } from '../utils/utils';
import { RsError } from '../utils/errors';
import { Application } from 'express';
import { RsRequest } from '../@types/expressCustom';

export interface GeneralApiArgs {
	endpointBaseName: string;
	app: Application;
}

export default abstract class GeneralApi {
	endpointBaseName: string;
	endpointPrefix: string;
	app: Application;

	constructor(apiArgs: GeneralApiArgs) {
		this.endpointBaseName = apiArgs.endpointBaseName;
		this.endpointPrefix = '/api/v1/' + apiArgs.endpointBaseName;

		this.app = apiArgs.app;
	}

	getCreateObjectFromRequest(req: RsRequest<any>, columns: any, preventUpdateColumns: string[] = []) {
		return this.getCreateObjectFromData({ body: req.body, user: req.user }, columns, preventUpdateColumns);
	}

	getCreateObjectFromData(
		data: RedSky.GenericCreateObjectFromRequest,
		columns: any,
		preventUpdateColumns: string[] = []
	) {
		let params = columns;
		let obj: any = {};
		for (let i in params) {
			const param = params[i];
			if (preventUpdateColumns.includes(param)) continue;
			let paramData = data.body[params[i]];
			if (typeof paramData === 'undefined') continue;

			if (paramData != null && typeof paramData == 'object') {
				paramData = JSON.stringify(paramData);
			}
			if (typeof paramData === 'string') {
				paramData = paramData.trim();
			}
			if ((param.indexOf('country') > -1 || param.indexOf('state') > -1) && paramData.trim().length > 2)
				throw new RsError('BAD_REQUEST', `Invalid field length - ${param}`);
			obj[param] = paramData;
			if (obj[param] == null || obj[param] == undefined) {
				delete obj[param];
			}
		}
		let userId = null;
		if (data.user && data.user.id) {
			userId = data.user.id;
		}
		if (data.body && data.body.userId) {
			userId = data.body.userId;
		}

		if (params == null) {
			params = '';
		}

		// Add other common attributes
		if (params.includes('createdById')) {
			obj.createdById = userId;
		}
		if (params.includes('userId')) {
			obj.userId = data.body.userId || userId;
		}
		if (params.includes('companyId')) {
			obj.companyId = data.body.companyId;
		}
		if (params.includes('createdOn')) {
			obj.createdOn = DateUtils.dbNow();
		}
		if (params.includes('updatedOn')) {
			obj.updatedOn = DateUtils.dbNow();
		}

		return obj;
	}

	pageFilterData(queryData: RedSky.PageQuery): RedSky.PageQuery {
		let formattedPaginationData: RedSky.PageQuery = { pagination: {}, sort: {}, filter: {} } as RedSky.PageQuery;
		let paginationData = ObjectUtils.smartParse(queryData?.pagination);
		if (!paginationData) paginationData = {};
		if (!paginationData.page) paginationData.page = 1;
		if (!paginationData.perPage) paginationData.perPage = 50;
		const sortData = ObjectUtils.smartParse(queryData?.sort);
		const filterData = ObjectUtils.smartParse(queryData.filter);
		formattedPaginationData.pagination = paginationData;
		formattedPaginationData.sort.field = !sortData?.field ? 'id' : sortData.field;
		formattedPaginationData.sort.order = !sortData?.order ? 'DESC' : sortData.order;
		if (!ObjectUtils.isEmptyObject(filterData)) formattedPaginationData.filter = filterData;
		return formattedPaginationData;
	}
}
