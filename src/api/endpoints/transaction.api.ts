import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { boundMethod } from 'autobind-decorator';
import serviceFactory from '../../services/serviceFactory';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import { IFidel } from '../../integrations/fidel/IFidel';
import TransactionService from '../../services/transaction/transaction.service';
import publicUrl from '../../@decorators/publicUrl';
import { WebUtils } from '../../utils/utils';

export default class TransactionApi extends GeneralApi {
	transactionService: TransactionService;

	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.app.post(`${pre}/offsite/auth`, this.offsiteTransactionAuth);
		this.app.post(`${pre}/offsite/refund`, this.offsiteTransactionRefund);

		this.transactionService = serviceFactory.get<TransactionService>('TransactionService');
	}

	@boundMethod
	@publicUrl('POST', '/transaction/offsite/auth')
	async offsiteTransactionAuth(
		req: RsRequest<IFidel.Transaction.Req.Auth>,
		res: RsResponse<Api.Transaction.Res.OffsiteResponse>
	) {
		await this.transactionService.offsiteAuth(req.data, WebUtils.getCompanyId(req));
		res.send(true);
	}

	@boundMethod
	@publicUrl('POST', '/transaction/offsite/refund')
	async offsiteTransactionRefund(
		req: RsRequest<IFidel.Transaction.Req.Refund>,
		res: RsResponse<Api.Transaction.Res.OffsiteResponse>
	) {
		await this.transactionService.offsiteRefund(req.data, WebUtils.getCompanyId(req));
		res.send(true);
	}
}
