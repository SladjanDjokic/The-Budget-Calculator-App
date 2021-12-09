import { IFidel } from './IFidel';
import Axios from '../../utils/axios/Axios';
import { RsError } from '../../utils/errors';
import logger from '../../utils/logger';

export default class Fidel {
	private axios: Axios;
	private defaultHeaders;

	constructor(readonly serviceDetails: IFidel.ServiceDetails) {
		this.axios = new Axios();
		this.defaultHeaders = {
			headers: {
				'Content-Type': 'application/json',
				'fidel-key': this.serviceDetails.apiPrivateKey
			}
		};
	}

	async deleteCard(cardDetails: Model.UserPaymentMethod) {
		return this.sendHandleResponse(
			this.axios.deleteRequest(`${this.serviceDetails.baseUrl}/cards/${cardDetails.token}`, this.defaultHeaders)
		);
	}

	async getBrandList(): Promise<IFidel.Brands.Res.List> {
		return this.sendHandleResponse(this.axios.get(`${this.serviceDetails.baseUrl}/brands`, this.defaultHeaders));
	}

	async getLocationsForBrand(brandId: string): Promise<IFidel.Location.Res.List> {
		return this.sendHandleResponse(
			this.axios.get(
				`${this.serviceDetails.baseUrl}/brands/${brandId}/programs/${this.serviceDetails.programId}/locations`,
				this.defaultHeaders
			)
		);
	}

	private async sendHandleResponse(method: Promise<any>) {
		try {
			const response = await method;
			// Handle response codes
			return response;
		} catch (e) {
			logger.error(e);
			throw new RsError('BAD_REQUEST', e);
		}
	}
}
