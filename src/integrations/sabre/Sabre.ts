import { ISabre } from './Sabre.interface';
import { StringUtils } from '../../utils/utils';
import Axios from '../../utils/axios/Axios';
import { RsError } from '../../utils/errors';
import logger from '../../utils/logger';
import xml2js from 'xml2js';

enum SoapActionUrls {
	CheckAvailability = 'http://synxis.com/OTA2004AService/CheckAvailability'
}

export default class Sabre {
	private readonly token: string;
	private readonly baseRestUrl: string;
	private readonly baseSoapUrl: string;
	private readonly username: string;
	private readonly password: string;
	private readonly apiVersion: string;
	private readonly axiosConfig = {
		charset: 'utf-8',
		'Content-Type': 'application/json',
		Context: 'SYNXISWS_VA'
	};
	private readonly axios: Axios;

	constructor(serviceDetails: ISabre.ServiceDetails) {
		this.baseRestUrl = serviceDetails.baseRestUrl;
		this.baseSoapUrl = serviceDetails.baseSoapUrl;
		this.username = serviceDetails.username;
		this.password = serviceDetails.password;
		this.apiVersion = serviceDetails.apiVersion;
		this.axios = new Axios();
		this.token = this.getAuthenticationTokenString();
	}

	async getHotelList(chainId: number): Promise<ISabre.Destination.Res.HotelList> {
		return this.axios.get(
			`${this.baseRestUrl}/${this.apiVersion}/api/hotel/list?chainId=${chainId}&include=Attributes,HotelGroups,LocationInfo`,
			{
				headers: { Authorization: `Bearer ${await this.getSabreAccessToken()}` }
			}
		);
	}

	async getHotelById(hotelId: number) {
		return this.axios.get(
			`${this.baseRestUrl}/${this.apiVersion}/api/hotel/${hotelId}/details?include=Attributes,ContactInfo,ChannelProperties,Currency,DiningOptions,Features,HotelGroups,Images,Languages,LocationInfo,MealPlans,MediaLibraryImages,Messages,PaymentMethods,Recreations,ReferencePoints,Services,Tier,Transportation`,
			{
				headers: { Authorization: `Bearer ${await this.getSabreAccessToken()}` }
			}
		);
	}

	async getRates(hotelId: number, chainId: number): Promise<ISabre.Reservation.Res.Rates> {
		return this.axios.get(
			`${this.baseRestUrl}/${this.apiVersion}/api/hotel/rates?chainId=${chainId}&hotelId=${hotelId}&type=Public`,
			{
				headers: { Authorization: `Bearer ${await this.getSabreAccessToken()}` }
			}
		);
	}

	async getHotelAvailability(queryStringSearchCriteria: string) {
		return this.axios.get(
			`${this.baseRestUrl}/${this.apiVersion}/api/hotel/availability?${queryStringSearchCriteria}`,
			{
				headers: {
					charset: 'utf-8',
					'content-type': 'application/json',
					accept: 'application/json',
					Authorization: `Bearer ${await this.getSabreAccessToken()}`
				}
			}
		);
	}

	async bookReservation(request: ISabre.Reservation.Req.Create): Promise<ISabre.Reservation.Res.Create> {
		return this.axios.post(`${this.baseRestUrl}/${this.apiVersion}/api/reservation`, request, {
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `Bearer ${await this.getSabreAccessToken()}`
			}
		});
	}

	async getReservation(hotelId: string, reservationId: string): Promise<ISabre.Reservation.Res.Get> {
		return this.axios.get(
			`${this.baseRestUrl}/${this.apiVersion}/api/reservation/hotel/${hotelId}/${reservationId}`,
			{
				headers: {
					charset: 'utf-8',
					'content-type': 'application/json',
					accept: 'application/json',
					Authorization: `Bearer ${await this.getSabreAccessToken()}`
				}
			}
		);
	}

	async updateReservation(sabreUpdateRequest: ISabre.Reservation.Req.Update): Promise<ISabre.Reservation.Res.Update> {
		return this.axios.patch(`${this.baseRestUrl}/${this.apiVersion}/api/reservation`, sabreUpdateRequest, {
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `Bearer ${await this.getSabreAccessToken()}`
			}
		});
	}

	async cancelReservation(request: ISabre.Reservation.Req.Cancel): Promise<ISabre.Reservation.Res.Cancel> {
		return this.axios.post(`${this.baseRestUrl}/${this.apiVersion}/api/reservation/cancel`, request, {
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `Bearer ${await this.getSabreAccessToken()}`
			}
		});
	}

	async getRoomTypesForHotel(hotelId: string): Promise<ISabre.AccommodationType.Res.ForHotel> {
		return this.axios.get(`${this.baseRestUrl}/${this.apiVersion}/api/admin/hotels/${hotelId}/roomTypes`, {
			headers: { ...this.axiosConfig, Authorization: `Bearer ${await this.getSabreAccessToken()}` }
		});
	}

	async getRoomTypeDetailsForHotel(chainId: number, hotelId: string, roomTypeCode: string) {
		return this.axios.get(
			`${this.baseRestUrl}/${this.apiVersion}/api/hotel/rooms?chainId=${chainId}&hotelId=${hotelId}&primaryChannel=WEB&secondaryChannel=WBSVC&code=${roomTypeCode}&view=full&pageSize=0`,
			{
				headers: {
					charset: 'utf-8',
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: `Bearer ${await this.getSabreAccessToken()}`
				}
			}
		);
	}

	async getRoomsForHotel(chainId: number, hotelId: string): Promise<ISabre.Accommodation.Res.ForHotel> {
		return this.axios.get(
			`${this.baseRestUrl}/${this.apiVersion}/api/hotel/rooms?chainId=${chainId}&hotelId=${hotelId}&view=full`,
			{
				headers: {
					charset: 'utf-8',
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: `Bearer ${await this.getSabreAccessToken()}`
				}
			}
		);
	}

	async getDestinationTaxes(destinationSabreId: string): Promise<ISabre.Tax.Res.Get> {
		return this.axios.get(`${this.baseRestUrl}/${this.apiVersion}/api/admin/hotels/${destinationSabreId}/taxes`, {
			headers: {
				charset: 'utf-8',
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `Bearer ${await this.getSabreAccessToken()}`
			}
		});
	}

	async getDynamicPackages(payload: string): Promise<ISabre.DynamicPackage.Res> {
		const endpoint = `${this.baseSoapUrl}/ChannelConnect/api/soap12`;
		const envelope = this.getSoapEnvelope(SoapActionUrls.CheckAvailability, endpoint, payload);
		return this.axios
			.post(endpoint, envelope, {
				headers: {
					charset: 'utf-8',
					'Content-Type': 'application/soap+xml',
					Accept: 'text/xml'
				}
			})
			.then(this.parseDynamicPackageSoap)
			.catch(async function (err): Promise<any> {
				logger.error('SOAP API call failed: ' + err);
			});
	}

	private async getSabreAccessToken() {
		const sabreAccessToken: ISabre.Model.AccessToken = (await this.axios.post(
			`${this.baseRestUrl}/${this.apiVersion}/auth/token`,
			{
				GrantType: 'CLIENT_CREDENTIALS',
				UserIPAddress: '127.0.0.1',
				UserType: 'Hotel',
				BusinessContext: 'Default'
			},
			{ headers: { ...this.axiosConfig, Authorization: `Basic ${this.token}` } }
		)) as ISabre.Model.AccessToken;
		if (!sabreAccessToken.access_token) {
			logger.error('Failed to get Sabre Access token');
			logger.error(JSON.stringify(sabreAccessToken));
			throw new RsError('SERVICE_UNAVAILABLE', JSON.stringify(sabreAccessToken));
		}
		return sabreAccessToken.access_token;
	}

	private getAuthenticationTokenString() {
		return StringUtils.btoa(`${StringUtils.btoa(this.username)}:${StringUtils.btoa(this.password)}`);
	}

	private getSoapEnvelope(actionUrl: string, endpointUrl: string, payload: string) {
		return `
			<soap:Envelope xmlns:ns="http://www.opentravel.org/OTA/2003/05" xmlns:head="http://htng.org/1.1/Header/"
			xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
				<soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
					<HTNGHeader xmlns="http://htng.org/1.1/Header/">
						<From>
							<Credential>
								<userName>${this.username}</userName>
								<password>${this.password}</password>
							</Credential>
						</From>
					</HTNGHeader>
					<wsa:Action>${actionUrl}</wsa:Action>
					<wsa:To>${endpointUrl}</wsa:To>
				</soap:Header>
				<soap:Body>
					${payload}
				</soap:Body>
			</soap:Envelope>`;
	}

	private parseDynamicPackageSoap(xmlResponse: string): Promise<ISabre.DynamicPackage.Res> {
		const prefixes: Array<string> = ['s:', 'a:'];
		function stripPrefix(name: string): string {
			for (let prefix of prefixes) {
				if (name.startsWith(prefix)) {
					name = name.substr(prefix.length);
					break;
				}
			}
			return name;
		}
		return xml2js.parseStringPromise(xmlResponse, {
			tagNameProcessors: [stripPrefix],
			explicitArray: false,
			mergeAttrs: true
		});
	}
}
