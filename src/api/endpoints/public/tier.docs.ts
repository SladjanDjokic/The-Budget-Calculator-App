/**
 * @typedef Tier
 * @property {number} id -
 * @property {number} companyId -
 * @property {string} name -
 * @property {string} description -
 * @property {Date | string} createdOn -
 * @property {Date | string} modifiedOn -
 * @property {number} isActive -
 * @property {undefined} accrualRate -
 * @property {number} threshold -
 * @property {string} features -
 */

/**
 * create a new Tier
 * @route POST /tier/
 * @group Tier - Tier APIs
 * @param {Tier.model} tier.body.required - tier object is going to be created
 * @returns {Tier.model} 200 - Tier object
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 409 - { err: 'DUPLICATE', msg: 'Duplicate entry for key' }
 * @returns {Error} default - Unexpected error
 */

/**
 * Get Tier by ID
 * @route GET /tier/
 * @group Tier - Tier APIs
 * @param {number} id.query.required - tier Id
 * @returns {Tier.model} 200 - Tier
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */

/**
 * Get all Tiers
 * @route GET /tier/
 * @group Tier - Tier APIs
 * @param {Array<number>} ids.query.required = tier ids
 * @returns {Array<Tier>} 200 - All Tiers
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get all items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */
