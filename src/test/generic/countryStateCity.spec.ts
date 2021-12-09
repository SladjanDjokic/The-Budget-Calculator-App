import chai from 'chai';
import countryStateCity from '../../utils/countryStateCity';
import { ICity, ICountry, IState } from 'country-state-city';
describe('Country State City utility', function () {
	let countryList: ICountry[];
	let stateList: IState[];
	it('should get a list of all countries', function () {
		const countries: ICountry[] = countryStateCity.getAllCountries();
		chai.expect(countries).to.exist;
		chai.expect(countries).to.be.an('array');
		chai.expect(countries.length).to.be.greaterThan(0);
		chai.expect(countries[0]).to.haveOwnProperty('name');
		chai.expect(countries[0]).to.haveOwnProperty('isoCode');
		chai.expect(countries[0]).to.haveOwnProperty('currency');
		countryList = countries;
	});
	it('should get the country of United States give the US country code', function () {
		const country: ICountry = countryStateCity.getCountryByCode('US');
		chai.expect(country).to.exist;
		chai.expect(country.isoCode).to.equal('US');
		chai.expect(country.name).to.equal('United States');
	});
	it('should get a list of states for a country code', function () {
		const states: IState[] = countryStateCity.getCountryStates(countryList[0].isoCode);
		chai.expect(states).to.exist;
		chai.expect(states).to.be.an('array');
		chai.expect(states.length).to.be.greaterThan(0);
		chai.expect(states[0]).to.haveOwnProperty('name');
		chai.expect(states[0]).to.haveOwnProperty('isoCode');
		chai.expect(states[0]).to.haveOwnProperty('countryCode');
		stateList = states;
	});
	it('should get a list of cities for a give country and state', function () {
		const cities: ICity[] = countryStateCity.getStateCities(countryList[0].isoCode, stateList[0].isoCode);
		chai.expect(cities).to.exist;
		chai.expect(cities).to.be.an('array');
		chai.expect(cities.length).to.be.greaterThan(0);
		chai.expect(cities[0]).to.haveOwnProperty('name');
		chai.expect(cities[0]).to.haveOwnProperty('countryCode');
		chai.expect(cities[0]).to.haveOwnProperty('stateCode');
	});
});
