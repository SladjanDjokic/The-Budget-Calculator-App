/**
 * @typedef Company
 * @property {number} id -
 * @property {string} name -
 * @property {string} squareLogoUrl -
 * @property {string} wideLogoUrl -
 * @property {string} description -
 * @property {Date | string} createdOn - ISO-8601
 * @property {Date | string} modifiedOn - ISO-8601
 * @property {string} vanityUrls -
 * @property {string} privacyPolicyUrl -
 * @property {string} termsConditionsUrl -
 * @property {string} returnPolicyUrl -
 * @property {string} address -
 * @property {string} city -
 * @property {string} state -
 * @property {string} zip -
 * @property {string} country -
 */

/**
 * Get Company by ID
 * @route GET /company/
 * @group Company - Company APIs
 * @param {number} id.query.required - company Id
 * @returns {Company.model} 200 - Company
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */

/**
 * Update an existing Company
 * @route PUT /company/
 * @group Company - Company APIs
 * @param {Company.model} company.body.required - @table_name_desc@ object is going to be updated
 * @returns {Company.model} 200 - company object
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get all items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 * @returns {Error} 400 - { err: BAD_REQUEST msg: "Invalid Field" }
 * @returns {Error} default - Unexpected error
 */
