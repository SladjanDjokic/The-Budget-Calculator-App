import { ISpreedly } from './ISpreedly';
import Axios from '../../utils/axios/Axios';
import { ObjectUtils, StringUtils } from '../../utils/utils';
import { RsError } from '../../utils/errors';

export default class Spreedly {
	private axios: Axios;
	constructor(readonly serviceDetails: ISpreedly.ServiceDetails, readonly gateway: Model.CompanyGateway) {
		this.axios = new Axios();
	}

	async store(formattedForStore: ISpreedly.Store.Req): Promise<ISpreedly.Store.Res> {
		return this.sendHandleResponse(
			this.axios.post(
				`${this.serviceDetails.baseUrl}/v1/gateways/${this.gateway.token}/store.json`,
				formattedForStore,
				{
					headers: {
						Authorization: `Basic ${StringUtils.btoa(
							`${this.serviceDetails.environmentKey}:${this.serviceDetails.apiKey}`
						)}`,
						'Content-Type': 'application/json',
						Accept: 'application/json'
					}
				}
			)
		);
	}

	show(paymentMethodToken: string): Promise<ISpreedly.Show.Res> {
		return this.sendHandleResponse(
			this.axios.get(`${this.serviceDetails.baseUrl}/v1/payment_methods/${paymentMethodToken}.json`, {
				headers: {
					Authorization: `Basic ${StringUtils.btoa(
						`${this.serviceDetails.environmentKey}:${this.serviceDetails.apiKey}`
					)}`,
					'Content-Type': 'application/json',
					Accept: 'application/json'
				}
			})
		);
	}

	async deliverRequestToReceiver(
		receiver: ISpreedly.Models.Receiver,
		requestToPass: any
	): Promise<ISpreedly.Delivery.Res> {
		return this.sendHandleResponse(
			this.axios.post(
				`${this.serviceDetails.baseUrl}/v1/receivers/${receiver.token}/deliver.json`,
				requestToPass,
				{
					headers: {
						Authorization: `Basic ${StringUtils.btoa(
							`${this.serviceDetails.environmentKey}:${this.serviceDetails.apiKey}`
						)}`,
						'Content-Type': 'application/json',
						Accept: 'application/json'
					}
				}
			)
		);
	}

	async retain(paymentToken: string): Promise<ISpreedly.Retain.Res.Retain> {
		return this.sendHandleResponse(
			this.axios.put(`${this.serviceDetails.baseUrl}/v1/payment_methods/${paymentToken}/retain.json`, null, {
				headers: {
					Authorization: `Basic ${StringUtils.btoa(
						`${this.serviceDetails.environmentKey}:${this.serviceDetails.apiKey}`
					)}`,
					'Content-Type': 'application/json',
					Accept: 'application/json'
				}
			})
		);
	}

	private async sendHandleResponse(method: Promise<any>) {
		try {
			const response = await method;
			// Handle response codes
			return response;
		} catch (e) {
			const errorMsg: ISpreedly.Models.Error | ISpreedly.Store.Res = ObjectUtils.smartParse(e.msg);
			if (errorMsg && 'transaction' in errorMsg)
				this.handlePaymentFailure(errorMsg as ISpreedly.Store.Res, e.status);
			throw new RsError('BAD_REQUEST', e);
		}
	}

	private handlePaymentFailure(errorMsg: ISpreedly.Store.Res, statusCode: number) {
		if (statusCode >= 401 && statusCode < 500)
			throw new RsError('UNAUTHORIZED', errorMsg.transaction?.message || errorMsg.transaction?.state);
		if (statusCode > 499) throw new RsError('SERVICE_UNAVAILABLE', JSON.stringify(errorMsg));
		const bodyResponse = ObjectUtils.smartParse(errorMsg.transaction?.response?.body);
		if (bodyResponse) throw new RsError('BAD_REQUEST', bodyResponse?.error?.message);
		throw new RsError('BAD_REQUEST', errorMsg.transaction.message);
	}
}
