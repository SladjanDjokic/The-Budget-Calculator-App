/**
 * @typedef UserAddress
 * @property {number} id -
 * @property {number} userId -
 * @property {string} type -
 * @property {string} address1 -
 * @property {string} address2 -
 * @property {string} city -
 * @property {string} state -
 * @property {string} zip -
 * @property {string} country -
 * @property {type} default -- eg: 0 | 1
 * @property {Date | string} createdOn - ISO-8601
 * @property {Date | string} modifiedOn - ISO-8601
 */

/**
 * @typedef Pagination
 * @property {number} page - page number 1,2,3, etc
 * @property {number} perPage - count wanting returned per page
 */

/**
 * @typedef Sort
 * @property {string} field - the desired field to sort on
 * @property {string} order - Order to sort in e.g., ASC, DESC, RAND
 */

/**
 * @typedef FilterObject
 * @property {string} column - column to perform filter action on
 * @property {string | number | Array<string> | Array<number>} value - value to evaluate on
 * @property {string} conjunction.optional - (optional) Conjunction to concatenate together (AND, OR)
 * @property {string} matchType.optional - (optional) used if chaining filters together
 */

/**
 * @typedef Filter
 * @property {string} matchType - Desired matchtype (like, exact, greaterThan, lessThan)
 * @property {Array<FilterObject>} searchTerm - combination of filter objects to query on
 */

/**
 * @typedef PagedResponse
 * @property {Array<UserAddress>} data
 * @property {number} total
 */

/**
 * create a new UserAddress
 * @route POST /userAddress/
 * @group UserAddress - UserAddress APIs
 * @param {UserAddress.model} userAddress.body.required - userAddress object is going to be created
 * @returns {UserAddress.model} 200 - UserAddress object
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 409 - { err: 'DUPLICATE', msg: 'Duplicate entry for key' }
 * @returns {Error} default - Unexpected error
 */

/**
 * Get UserAddress by ID
 * @route GET /userAddress/
 * @group UserAddress - UserAddress APIs
 * @param {number} id.query.required - userAddress Id
 * @returns {UserAddress.model} 200 - UserAddress
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */

/**
 * Get UserAddresss
 * @route GET /userAddress/
 * @group UserAddress - UserAddress APIs
 * @param {Array<number>} ids.query.required - userAddress ids
 * @returns {Array<UserAddress>} 200 - All UserAddresss
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get all items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */

/**
 * Get UserAddresses Paged
 * @route GET /userAddress/paged
 * @group UserAddress - UserAddress APIs
 * @param {Pagination} pagination.query.optional
 * @param {Sort} sort.query.optional
 * @param {Filter} filter.query.optional
 * @returns {PagedResponse.model} 200
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get all items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */

/**
 * Update an existing UserAddress
 * @route PUT /userAddress/
 * @group UserAddress - UserAddress APIs
 * @param {UserAddress.model} userAddress.body.required - @table_name_desc@ object is going to be updated
 * @returns {UserAddress.model} 200 - userAddress object
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get all items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 * @returns {Error} 400 - { err: BAD_REQUEST msg: "Invalid Field" }
 * @returns {Error} default - Unexpected error
 */

/**
 * Delete an existing UserAddress
 * @route DELETE /userAddress/
 * @group UserAddress - UserAddress APIs
 * @param {object} id.body.required - Object id to be deleted
 * @returns {boolean} 200 - boolean of resulting delete
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 * @returns {Error} default - Unexpected error
 */
