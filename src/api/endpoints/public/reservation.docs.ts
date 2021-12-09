/**
 * @typedef Reservation
 * @property {number} id -
 * @property {number} companyId -
 * @property {number} userId -
 * @property {number} destinationId -
 * @property {number} accommodationId -
 * @property {number} bookingSourceId -
 * @property {number} marketSegmentId -
 * @property {number} orderId -
 * @property {string} reservationNumber -
 * @property {Date | string} arrivalDate - ISO-8601
 * @property {Date | string} departureDate - ISO-8601
 * @property {string} status -
 * @property {Date | string} createdOn - ISO-8601
 * @property {Date | string} modifiedOn - ISO-8601
 * @property {Date | string} canceledOn - ISO-8601
 * @property {string} externalReservationNumber -
 * @property {string} cancelNumber -
 * @property {string} externalCancelNumber -
 * @property {number} adultCount -
 * @property {number} childCount -
 * @property {number} infantCount -
 * @property {Date | string} confirmationDate - ISO-8601
 * @property {number} nightCount -
 */

/**
 * @typedef ReservationAccommodation
 * @property {number} id - accommodationId
 * @property {string} name -
 * @property {string} code -
 * @property {string} shortDescription -
 * @property {string} longDescription -
 * @property {number} roomCount -
 * @property {number} floorCount -
 * @property {Date | string} createdOn - ISO-8601
 * @property {Date | string} modifiedOn - ISO-8601
 * @property {string} status -
 * @property {number} isPrivate -
 * @property {number} isRentReady -
 * @property {string} phase -
 * @property {string} lot -
 * @property {Date | string} closingDate - ISO-8601
 * @property {string} houseView -
 * @property {string} furnitureDescription -
 * @property {string} kitchenDescription -
 * @property {string} modelDescription -
 * @property {string} managementCompany -
 * @property {number} maxOccupantCount -
 * @property {number} maxSleeps -
 * @property {string} propertyCode -
 * @property {Date | string} agreementDate - ISO-8601
 * @property {string} propertyStatus -
 * @property {string} accommodationCode -
 * @property {number} priceCents -
 * @property {string} roomClass -
 * @property {string} bedDetails -
 * @property {number} extraBeds -
 * @property {number} extraBedPriceCents -
 * @property {number} adaCompliant -
 */

/**
 * @typedef ReservationDestination
 * @property {number} id - destinationId
 * @property {string} name -
 * @property {string} code -
 * @property {string} description -
 * @property {string} status -
 * @property {string} address1 -
 * @property {string} address2 -
 * @property {string} city -
 * @property {string} state -
 * @property {string} zip -
 * @property {string} country -
 */

/**
 * @typedef ReservationOrder
 * @property {number} id - orderId
 * @property {number} paymentMethodId -
 * @property {number} number -
 * @property {string} status -
 * @property {string} type -
 * @property {number} totalPriceCents -
 * @property {number} subTotalPriceCents -
 * @property {number} taxPriceCents -
 * @property {number} shippingPriceCents -
 * @property {number} discountPriceCents -
 * @property {Date | string} createdOn - ISO-8601
 * @property {Date | string} modifiedOn - ISO-8601
 */

/**
 * @typedef FullReservation
 * @property {number} id -
 * @property {number} companyId -
 * @property {number} userId -
 * @property {number} destinationId -
 * @property {number} accommodationId -
 * @property {number} bookingSourceId -
 * @property {number} marketSegmentId -
 * @property {number} orderId -
 * @property {string} reservationNumber -
 * @property {Date | string} arrivalDate - ISO-8601
 * @property {Date | string} departureDate - ISO-8601
 * @property {string} status -
 * @property {Date | string} createdOn - ISO-8601
 * @property {Date | string} modifiedOn - ISO-8601
 * @property {Date | string} canceledOn - ISO-8601
 * @property {string} externalReservationNumber -
 * @property {string} cancelNumber -
 * @property {string} externalCancelNumber -
 * @property {number} adultCount -
 * @property {number} childCount -
 * @property {number} infantCount -
 * @property {Date | string} confirmationDate - ISO-8601
 * @property {number} nightCount -
 * @property {number} bookingSourceId -
 * @property {string} bookingSourceName -
 * @property {ReservationAccommodation.model} accommodation -
 * @property {ReservationDestination.model} destination -
 * @property {ReservationOrder.model} order -
 */

/**
 * @typedef FormattedReservation
 * @property {number} destinationId - Specific destination id
 * @property {Array.<AvailableAccommodations>} accommodations - Array of AvailableAccommodations at the specified destination/date
 */

/**
 * @typedef FormattedAccommodationPrice
 * @property {number} total
 * @property {string} currencyCode
 * @property {number} qtyAvailable
 * @property {string} rate
 * @property {type} maxPrice --eg: 0 | 1
 * @property {type} minPrice --eg: 0 | 1
 */

/**
 * @typedef AvailableAccommodations
 * @property {number} id
 * @property {string} name
 * @property {string} code
 * @property {string} status
 * @property {number} maxOccupancy
 * @property {number} maxSleeps
 * @property {string} roomClass
 * @property {type} adaCompliant --eg: 0 | 1
 * @property {Array.<FormattedAccommodationPrice>} prices - Array of price objects
 */

/**
 * @typedef RoomClass
 * @property {string} roomClass.optional - 'adacompliant'
 */

/**
 * @typedef ReservationAvailability
 * @property {Date | string} startDate.required - Start date for availability - ISO-8601
 * @property {Date | string} endDate.required - End date for availability - ISO-8601
 * @property {number} adults.required - Number of adults for the reservation period
 * @property {number} children.optional - Number of children for the reservation period
 * @property {number} currencyCode.optional - Number of children for the reservation period
 * @property {RoomClass.model} roomClass.optional - Number of children for the reservation period
 * @property {number} priceRangeMin.optional - Number of children for the reservation period
 * @property {number} priceRangeMax.optional - Number of children for the reservation period
 */

/**
 * @typedef pagination
 * @property {number} page - page number 1,2,3, etc
 * @property {number} perPage - count wanting returned per page
 */

/**
 * @typedef sort
 * @property {string} field - the desired field to sort on
 * @property {string} order - Order to sort in e.g., ASC, DESC, RAND
 */

/**
 * @typedef filterObject
 * @property {string} column - column to perform filter action on
 * @property {string | number | Array<string> | Array<number>} value - value to evaluate on
 * @property {string} conjunction - (optional) Conjunction to concatenate together (AND, OR)
 * @property {string} matchType - (optional) used if chaining filters together
 */

/**
 * @typedef filter
 * @property {string} matchType - Desired matchtype (like, exact, greaterThan, lessThan)
 * @property {Array<filterObject>} searchTerm - combination of filter objects to query on
 */

/**
 * create a new Reservation
 * @route POST /reservation/
 * @group Reservation - Reservation APIs
 * @param {Reservation.model} reservation.body.required - reservation object is going to be created
 * @returns {Reservation.model} 200 - Reservation object
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 409 - { err: 'DUPLICATE', msg: 'Duplicate entry for key' }
 * @returns {Error} default - Unexpected error
 */

/**
 * Get Reservation by ID
 * @route GET /reservation/
 * @group Reservation - Reservation APIs
 * @param {number} id.query.required - reservation Id
 * @returns {Reservation.model} 200 - Reservation
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */

/**
 * Get Many Reservations
 * @route GET /reservation/
 * @group Reservation - Reservation APIs
 * @param {Array<number>} ids.query.required - reservation ids
 * @returns {Array<Reservation.model>} 200 - All Reservations
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */

/**
 * Get paginated Reservations
 * @route GET /reservation/paged
 * @group Reservation - Reservation APIs
 * @param {pagination.model} pagination.query - pagination object
 * @param {sort.model} sort.query - sort object
 * @param {filter.model} filter.query - filter object
 * @returns {Array<FullReservation>} 200 - All FullReservation
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get all items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */

/**
 * Availability
 * @route GET /reservation/availability
 * @group Reservation - Reservation APIs
 * @param {Date | string} startDate.required - yyyy-mm-dd
 * @param {Date | string} endDate.required - yyyy-mm-dd
 * @param {number} adults.required - number of adults staying in the room
 * @param {number} children.optional - number of children staying in the room
 * @param {number} destinationId.optional - internal spire destination id
 * @param {string} currencyCode.optional - USD, EUR, GBP, etc
 * @param {string} roomClass.optional - adacompliance
 * @param {number} priceRangeMin.optional - number minimum room price
 * @param {number} priceRangeMax.optional - number maximum room price
 * @param {number} page.optional - pagination page
 * @param {number} limit.optional - pagination per page limit
 * @returns {FormattedReservation.model} 200 - Formatted array of destinations relative to selected date range
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 * @returns {Error} default - Unexpected error
 */
