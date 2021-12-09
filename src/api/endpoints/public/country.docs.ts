/**
 * @typedef Country
 * @property {string} name - Name of the country
 * @property {string} phonecode - starting digits of country (US - +1)
 * @property {string} isoCode - 2 digit ISO-3166 code
 * @property {string} flag - country flag code
 * @property {string} latitude -
 * @property {string} longitude -
 * @property {Array<TimeZone>} timezones -
 */

/**
 * @typedef TimeZone
 * @property {string} zoneName -
 * @property {number} gmtOffset -
 * @property {string} gmtOffsetName -
 * @property {string} abbreviation -
 * @property {string} tzName -
 */

/**
 * @typedef State
 * @property {string} name - State name
 * @property {string} isoCode - 2 digit ISO-3166 code
 * @property {string} countryCode - 2 digit ISO-3166 country code
 * @property {string} latitude -
 * @property {string} longitude -
 */

/**
 * @typedef City
 * @property {string} name - State name
 * @property {string} countryCode - 2 digit ISO-3166 country code
 * @property {string} stateCode - 2 digit ISO-3166 state code
 * @property {string} latitude -
 * @property {string} longitude -
 */

/**
 * Get All Countries
 * @route GET /country/all
 * @group Country - Country APIs
 * @returns {Array<Country>} 200 - Array of countries
 * @returns {Error} default - Unexpected error
 */

/**
 * Get a specific country
 * @route GET /country/
 * @group Country - Country APIs
 * @param {string} countryCode.query.required - ISO-3166 country code
 * @returns {Country.model} 200 - Country object
 * @returns {Error} default - Unexpected error
 */

/**
 * Get a list of states for a given country
 * @route GET /country/states
 * @group Country - Country APIs
 * @param {string} countryCode.query.required - ISO-3166 country code
 * @returns {Array<State>} 200 - Array of states for specified country
 * @returns {Error} 404 - {err: BAD_REQUEST, msg: "Country code not found"}
 * @returns {Error} default - Unexpected error
 */

/**
 * Get a list of cities for a given country and state
 * @route GET /country/cities
 * @group Country - Country APIs
 * @param {string} countryCode.query.required - ISO-3166 country code
 * @param {string} stateCode.query.required - ISO-3166 state code
 * @returns {Array<City>} 200 - Array of cities for a specified country and state
 * @returns {Error} 404 - {err: BAD_REQUEST, msg: "Country code not found"}
 * @returns {Error} default - Unexpected error
 */
