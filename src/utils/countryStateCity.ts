import csc from 'country-state-city';
import { ICountry, IState, ICity } from 'country-state-city';

class CountryStateCity {
	constructor() {}

	getAllCountries(): ICountry[] {
		return csc.getAllCountries();
	}

	getCountryByCode(countryCode: string): ICountry {
		return csc.getCountryByCode(countryCode);
	}

	getCountryStates(countryCode: string): IState[] {
		return csc.getStatesOfCountry(countryCode);
	}

	getStateCities(countryCode: string, stateCode: string): ICity[] {
		return csc.getCitiesOfState(countryCode, stateCode);
	}
}

const countryStateCity = new CountryStateCity();
export default countryStateCity;
