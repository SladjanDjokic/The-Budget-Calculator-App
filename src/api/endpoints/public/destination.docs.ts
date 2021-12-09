/**
 * @typedef Destination
 * @property {number} id -
 * @property {number} companyId -
 * @property {string} name -
 * @property {string} description -
 * @property {string} code -
 * @property {string} status -
 * @property {string} address1 -
 * @property {string} address2 -
 * @property {string} city -
 * @property {string} state -
 * @property {string} zip -
 * @property {string} country -
 * @property {string} logoUrl -
 * @property {string} heroUrl -
 * @property {string} metaData -
 * @property {string} externalSystemId -
 * @property {Date | string} modifiedOn -
 * @property {number} chainId -
 */

/**
 * @typedef DestinationDetails
 * @property {number} id -
 * @property {number} externalId -
 * @property {string} name -
 * @property {string} description -
 * @property {string} code -
 * @property {string} status -
 * @property {string} address1 -
 * @property {string} address2 -
 * @property {string} city -
 * @property {string} state -
 * @property {string} zip -
 * @property {string} country -
 * @property {string} logoUrl -
 * @property {string} heroUrl -
 * @property {Array<Media>} media -
 * @property {Array<DestinationFeatureSlim>} features -
 * @property {Array<DestinationPackages>} packages -
 * @property {Array<DestinationAccommodation>} accommodations -
 * @property {Array<DestinationAccommodationType>} accommodationTypes -
 * @property {Array<DestinationPolicies>} policies -
 */

/**
 * @typedef Media
 * @property {number} id -
 * @property {number} companyId -
 * @property {number} uploaderId -
 * @property {type} type -- eg: image | video | imagePyramid
 * @property {MediaUrls.model} urls -
 * @property {string} title -
 * @property {string} description -
 * @property {type} isPrimary -- eg: 0 | 1
 */

/**
 * @typedef MediaUrls
 * @property {string} thumb -
 * @property {string} smallSmall -
 * @property {string} small -
 * @property {string} mediumSmall -
 * @property {string} medium -
 * @property {string} large -
 */

/**
 * @typedef MediaDetails
 * @property {number} id
 * @property {type} isPrimary -- eg: 0 | 1
 */

/**
 * @typedef DestinationFeatureSlim
 * @property {number} id -
 * @property {number} companyId -
 * @property {string} title -
 * @property {string} description -
 * @property {string} icon -
 * @property {type} isActive --eg: 0 | 1
 * @property {type} isCarousel --eg: 0 | 1
 * @property {Array<Media>} media -
 */

/**
 * @typedef DestinationAccommodation
 * @property {number} id -
 * @property {string} name -
 * @property {string} shortDescription -
 * @property {string} longDescription -
 */

/**
 * @typedef DestinationAccommodationType
 * @property {number} id -
 * @property {string} name -
 * @property {string} description -
 * @property {string} code -
 */

/**
 * @typedef DestinationPackages
 * @property {number} id -
 * @property {number} companyId -
 * @property {string} title -
 * @property {string} description -
 * @property {string} code -
 * @property {Array<Media>} media -
 */

/**
 * @typedef DestinationPolicies
 * @property {type} type -- eg: CheckIn | CheckOut | Cancellation
 * @property {string} value -
 */

/**
 * @typedef DestionationUpdate
 * @property {number} id.body.required -
 * @property {string} description -
 * @property {string} status -
 * @property {string} address1 -
 * @property {string} address2 -
 * @property {string} city -
 * @property {string} state -
 * @property {string} zip -
 * @property {string} country -
 * @property {string} logoUrl -
 * @property {string} heroUrl -
 * @property {Array<MediaDetails>} mediaIds -
 */

/**
 * Update details about a destination
 * @route PUT /destination
 * @group Destination - Destination APIs
 * @param {DestionationUpdate.model} req.body
 * @returns {DestinationDetails.model} 200 -
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get all items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 * @returns {Error} 400 - { err: BAD_REQUEST msg: "Invalid Field" }
 * @returns {Error} default - Unexpected error
 */

/**
 * Get a destination details
 * @route GET /destination/details
 * @group Destination - Destination APIs
 * @param {number} destinationId.query.required
 * @returns {DestinationDetails.model} 200 -
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get all items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 * @returns {Error} 400 - { err: BAD_REQUEST msg: "Invalid Field" }
 * @returns {Error} default - Unexpected error
 */
