import { boundMethod } from 'autobind-decorator';
import { RsRequest, RsResponse } from '../../@types/expressCustom';
import { GeneralApiArgs } from '../GeneralApi';
import countryStateCity from '../../utils/countryStateCity';
import publicUrl from '../../@decorators/publicUrl';

export default class CountryApi {
	constructor(apiArgs: GeneralApiArgs) {
		const app = apiArgs.app;
		const pre = '/api/v1/country';

		app.get(`${pre}/all`, this.allCountries);
		app.get(`${pre}`, this.getCountry);
		app.get(`${pre}/states`, this.getStates);
		app.get(`${pre}/cities`, this.getCities);
	}

	@boundMethod
	@publicUrl('GET', '/country/all')
	async allCountries(req: RsRequest<Api.Country.Req.AllCountries>, res: RsResponse<Api.Country.Res.AllCountries>) {
		res.sendData({ countries: countryStateCity.getAllCountries() });
	}

	@boundMethod
	async getCountry(req: RsRequest<Api.Country.Req.Country>, res: RsResponse<Api.Country.Res.Country>) {
		res.sendData(countryStateCity.getCountryByCode(req.data.countryCode));
	}

	@boundMethod
	@publicUrl('GET', '/country/states')
	async getStates(req: RsRequest<Api.Country.Req.States>, res: RsResponse<Api.Country.Res.States>) {
		res.sendData({ states: countryStateCity.getCountryStates(req.data.countryCode) });
	}

	@boundMethod
	@publicUrl('GET', '/country/cities')
	async getCities(req: RsRequest<Api.Country.Req.Cities>, res: RsResponse<Api.Country.Res.Cities>) {
		res.sendData({ cities: countryStateCity.getStateCities(req.data.countryCode, req.data.stateCode) });
	}
}
