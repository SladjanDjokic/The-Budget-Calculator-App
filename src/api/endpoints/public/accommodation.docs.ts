/**
 * @typedef Accommodation
 * @property {number} id -
 * @property {number} companyId -
 * @property {number} destinationId -
 * @property {number} accommodationTypeId -
 * @property {string} name -
 * @property {string} code -
 * @property {string} shortDescription -
 * @property {string} longDescription -
 * @property {string} address1 -
 * @property {string} address2 -
 * @property {string} city -
 * @property {string} state -
 * @property {string} zip -
 * @property {string} country -
 * @property {number} roomCount -
 * @property {number} floorCount -
 * @property {Date | string} createdOn -
 * @property {Date | string} modifiedOn -
 * @property {type} status - The status of Accommodation - eg: ACTIVE | INACTIVE | DELETED
 * @property {type} isPrivate -- eg: 0 | 1
 * @property {type} isRentReady -- eg: 0 | 1
 * @property {string} phase -
 * @property {string} lot -
 * @property {Date | string} closingDate -
 * @property {string} houseView -
 * @property {string} furnitureDescription -
 * @property {string} kitchenDescription -
 * @property {string} modelDescription -
 * @property {string} managementCompany -
 * @property {number} maxOccupantCount -
 * @property {number} maxSleeps -
 * @property {string} propertyCode -
 * @property {string} agreementDate -
 * @property {string} propertyStatus -
 * @property {string} accommodationCode -
 * @property {number} priceCents -
 * @property {string} metaData -
 * @property {string} externalSystemId -
 * @property {string} roomClass -
 * @property {Array<AccommodationBedDetails>} bedDetails -
 * @property {type} extraBeds -- eg: 0 | 1
 * @property {string} extraBedPriceCents -
 * @property {type} adaCompliant -- eg: 0 | 1
 * @property {string} heroUrl -
 * @property {AccommodationSize.model} size -
 */

/**
 * @typedef AccommodationDetail
 * @property {number} id -
 * @property {number} companyId -
 * @property {number} destinationId -
 * @property {number} accommodationTypeId -
 * @property {string} name -
 * @property {string} code -
 * @property {string} shortDescription -
 * @property {string} longDescription -
 * @property {string} address1 -
 * @property {string} address2 -
 * @property {string} city -
 * @property {string} state -
 * @property {string} zip -
 * @property {string} country -
 * @property {number} roomCount -
 * @property {number} floorCount -
 * @property {Date | string} createdOn -
 * @property {Date | string} modifiedOn -
 * @property {type} status - The status of Accommodation - eg: ACTIVE | INACTIVE | DELETED
 * @property {type} isPrivate -- eg: 0 | 1
 * @property {type} isRentReady -- eg: 0 | 1
 * @property {string} phase -
 * @property {string} lot -
 * @property {Date | string} closingDate -
 * @property {string} houseView -
 * @property {string} furnitureDescription -
 * @property {string} kitchenDescription -
 * @property {string} modelDescription -
 * @property {string} managementCompany -
 * @property {number} maxOccupantCount -
 * @property {number} maxSleeps -
 * @property {string} propertyCode -
 * @property {Date | string} agreementDate -
 * @property {string} propertyStatus -
 * @property {string} accommodationCode -
 * @property {number} priceCents -
 * @property {string} metaData -
 * @property {string} externalSystemId -
 * @property {string} roomClass -
 * @property {Array<AccommodationBedDetails>} bedDetails -
 * @property {type} extraBeds -- eg: 0 | 1
 * @property {string} extraBedPriceCents -
 * @property {type} adaCompliant -- eg: 0 | 1
 * @property {string} heroUrl -
 * @property {AccommodationSize.model} size -
 * @property {string} logoUrl -
 * @property {type} accommodationType -- eg: HOTEL | RENTAL
 * @property {string} accommodationTypeCode -
 * @property {string} accommodationTypeDescription -
 * @property {Array<Media>} media -
 * @property {Array<AccommodationLayout>} layout -
 * @property {Array<AccommodationCategories>} categories -
 * @property {Array<AccommodationFeatureSlim>} features -
 */

/**
 * @typedef AccommodationLayout
 * @property {number} id -
 * @property {number} companyId -
 * @property {number} accommodationId -
 * @property {string} title -
 * @property {Array<AccommodationLayoutRooms>} rooms -
 * @property {Media.model} media -
 */

/**
 * @typedef AccommodationLayoutRooms
 * @property {number} id -
 * @property {number} companyId -
 * @property {number} accommodationLayoutId -
 * @property {string} title -
 * @property {string} description -
 */

/**
 * @typedef AccommodationCategories
 * @property {number} id -
 * @property {number} companyId -
 * @property {number} accommodationId -
 * @property {string} title -
 * @property {string} description -
 * @property {Array<Media>} media
 * @property {Array<AccommodationFeature>} features
 */

/**
 * @typedef AccommodationFeature
 * @property {number} id -
 * @property {number} companyId -
 * @property {number} brandId -
 * @property {number} destinationId -
 * @property {number} accommodationId -
 * @property {number} accommodationCategoryId -
 * @property {string} title -
 * @property {string} description -
 * @property {string} icon -
 * @property {type} isActive --eg: 0 | 1
 * @property {type} isCarousel --eg: 0 | 1
 * @property {Array<Media>} media -
 */

/**
 * @typedef AccommodationFeatureSlim
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
 * @typedef AccommodationBedDetails
 * @property {string} type -
 * @property {type} isPrimary -- eg: 0 | 1
 * @property {number} qty -
 * @property {string} description -
 */

/**
 * @typedef AccommodationSize
 * @property {number} max -
 * @property {number} min -
 * @property {string} units -- eg: sqft
 */

/**
 * @typedef MediaDetails
 * @property {number} id
 * @property {type} isPrimary -- eg: 0 | 1
 */

/**
 * @typedef AccommodationUpdate
 * @property {number} id - req.body.required
 * @property {string} name
 * @property {string} shortDescription
 * @property {string} longDescription
 * @property {string} address1
 * @property {string} address2
 * @property {string} city
 * @property {string} state
 * @property {string} zip
 * @property {string} country
 * @property {type} status - The status of Accommodation - eg: ACTIVE | INACTIVE | DELETED
 * @property {string} heroUrl
 * @property {Array<MediaDetails>} mediaIds
 */

/**
 * Update details about an accommodation
 * @route PUT /accommodation
 * @group Accommodation - Accommodation APIs
 * @param {AccommodationUpdate.model} req.body.required
 * @returns {AccommodationDetail.model} 200 -
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get all items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 * @returns {Error} 400 - { err: BAD_REQUEST msg: "Invalid Field" }
 * @returns {Error} default - Unexpected error
 */

/**
 * Get Details for a given accommodation
 * @route GET /accommodation/details
 * @group Accommodation - Accommodation APIs
 * @param {number} accommodationId.query.required
 * @returns {AccommodationDetail.model} 200 -
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get all items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 * @returns {Error} 400 - { err: BAD_REQUEST msg: "Invalid Field" }
 * @returns {Error} default - Unexpected error
 */
