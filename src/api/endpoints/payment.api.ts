import GeneralApi, { GeneralApiArgs } from '../GeneralApi';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import PaymentService from '../../services/payment/payment.service';
import serviceFactory from '../../services/serviceFactory';
import { boundMethod } from 'autobind-decorator';
import { WebUtils } from '../../utils/utils';
import roleAuthorization from '../../@decorators/roleAuthorization';
import publicUrl from '../../@decorators/publicUrl';

export default class PaymentApi extends GeneralApi {
	paymentService: PaymentService;

	constructor(apiArgs: GeneralApiArgs) {
		super(apiArgs);
		const pre = this.endpointPrefix;

		this.app.post(pre, this.create);
		this.app.delete(pre, this.delete);
		this.app.put(pre, this.update);
		this.app.get(`${pre}/public`, this.getClientGatewayPublic);
		this.app.get(`${pre}/active`, this.getActiveByUserId);

		this.paymentService = serviceFactory.get<PaymentService>('PaymentService');
	}

	@boundMethod
	@roleAuthorization('self', 'admin')
	async create(req: RsRequest<Api.Payment.Req.Create>, res: RsResponse<Api.Payment.Res.Create>) {
		const paymentResponse: Api.Payment.Res.Create = await this.paymentService.addPayment(
			{ userId: req.data.userId || req.user.id, ...req.data },
			WebUtils.getCompanyId(req)
		);
		res.sendData(paymentResponse);
	}

	@boundMethod
	@publicUrl('GET', '/payment/public')
	async getClientGatewayPublic(
		req: RsRequest<Api.Payment.Req.PublicData>,
		res: RsResponse<Api.Payment.Res.PublicData>
	) {
		const publicGatewayData: Api.Payment.Res.PublicData = await this.paymentService.getClientGatewayPublic();
		res.sendData(publicGatewayData);
	}

	@boundMethod
	async getActiveByUserId(
		req: RsRequest<Api.Payment.Req.ActiveForUser>,
		res: RsResponse<Api.Payment.Res.ActiveForUser>
	) {
		const userPaymentMethod: Model.UserPaymentMethod = await this.paymentService.getActiveByUserId(req.user.id);
		res.sendData(userPaymentMethod);
	}

	@boundMethod
	async delete(req: RsRequest<Api.Payment.Req.Delete>, res: RsResponse<Api.Payment.Res.Delete>) {
		const deletedId: number = await this.paymentService.delete(req.data.id);
		res.sendData(deletedId);
	}

	@boundMethod
	async update(req: RsRequest<Api.Payment.Req.Update>, res: RsResponse<Api.Payment.Res.Update>) {
		const updatedPaymentMethod: Model.UserPaymentMethod = await this.paymentService.update(req.data);
		res.sendData(updatedPaymentMethod);
	}
}
