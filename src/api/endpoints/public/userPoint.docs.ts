/**
 * @typedef UserPoint
 * @property {number} id -
 * @property {number} userId -
 * @property {number} userAction -
 * @property {number} orderId -
 * @property {number} reservationId -
 * @property {string} description -
 * @property {string} status -
 * @property {string} pointType -
 * @property {number} pointAmount -
 * @property {string} reason -
 * @property {string} notes -
 * @property {Date | string} createdOn -
 * @property {Date | string} modifiedOn -
 * @property {Date | string} availableOn -
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
 * @property {string} conjunction - (optional) Conjunction to concatenate together (AND, OR)
 * @property {string} matchType - (optional) used if chaining filters together
 */

/**
 * @typedef Filter
 * @property {string} matchType - Desired matchtype (like, exact, greaterThan, lessThan)
 * @property {Array<FilterObject>} searchTerm - combination of filter objects to query on
 */

/**
 * @typedef PagedResponse
 * @property {Array<UserPoint>} data
 * @property {number} total
 */

/**
 * Get UserPoint by ID
 * @route GET /userPoint/
 * @group UserPoint - UserPoint APIs
 * @param {number} id.query.required - userPoint Id
 * @returns {UserPoint.model} 200 - UserPoint
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */

/**
 * Get UserPoints by ID's
 * @route GET /userPoint/
 * @group UserPoint - UserPoint APIs
 * @param {Array<number>} ids.query.required - userPoint ids
 * @returns {Array<UserPoint>} 200 - All UserPoints
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get all items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */

/**
 * Get By Page
 * @route Get /userPoint/paged
 * @group UserPoint - UserPoint APIs
 * @param {Pagination.model} pagination.query - pagination object
 * @param {Sort.model} sort.query - sort object
 * @param {Filter.model} filter.query - filter object
 * @returns {PagedResponse.model} 200 - All UserPoints
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get all items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */
