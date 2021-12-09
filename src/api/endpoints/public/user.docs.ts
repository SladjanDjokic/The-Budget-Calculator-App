/**
 * @typedef User
 * @property {number} id
 * @property {number} companyId
 * @property {number} tierId
 * @property {number} userRoleId
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} primaryEmail
 * @property {string} accountNumber
 * @property {string} phone
 * @property {string} notes
 * @property {string} password
 * @property {string} token
 * @property {Date} inactiveOn
 * @property {number} resetPasswordOnLogin
 * @property {number} permissionLogin
 * @property {Date} createdOn
 * @property {Date} modifiedOn
 * @property {Date} joinedOn
 * @property {Date} birthDate
 * @property {Date} lastLoginOn
 * @property {string} passwordResetGuid
 * @property {Date} passwordResetExpiresOn
 * @property {string} gender
 * @property {string} ethnicity
 */

/**
 * @typedef UserFiltered
 * @property {number} id
 * @property {number} companyId
 * @property {number} tierId
 * @property {number} userRoleId
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} primaryEmail
 * @property {string} accountNumber
 * @property {string} phone
 * @property {string} notes
 * @property {string} token
 * @property {Date} createdOn
 * @property {Date} modifiedOn
 * @property {Date} joinedOn
 * @property {Date} birthDate
 * @property {Date} lastLoginOn
 */

/**
 * @typedef {UserFiltered} UserDetail
 * @type {Api.User.Filtered}
 * @property {string} tierTitle - Tier Title user belongs to
 * @property {Media.model} tierBadge
 * @property {number} pendingPoints
 * @property {number} nextTierThreshold
 * @property {string} nextTierTitle
 * @property {number} pointsExpiring
 * @property {Date | string} pointsExpiringOn - ISO-8601
 * @property {Array<PaymentMethod>} paymentMethods
 */

/**
 * @typedef UserRole
 * @property {number} id
 * @property {number} companyId
 * @property {string} name
 * @property {Date | string} createdOn - ISO-8601
 * @property {Date | string} modifiedOn - ISO-8601
 * @property {Array<UserRoleAccessScope>} accessScope
 * @property {type} isAdmin -- eg: 0 | 1
 * @property {type} isCustomer -- eg: 0 | 1
 */

/**
 * @typedef UserRoleAccessScope
 * @property {type} accessScope -- eg: USER | POINTS | TEST | USER_POINTS | LOYALTY_CAMPAIGNS | LOYALTY_REWARDS | ADMINISTRATION | MEDIA_ACCESS | ORDERS | ANALYTICS | REAL_ESTATE
 * @property {type} read -- eg: 0 | 1
 * @property {type} write -- eg: 0 | 1
 */

/**
 * @typedef UserLogin
 * @property {string} username.required - Username for authentication (user email)
 * @property {string} password.required - Plain text password
 */

/**
 * @typedef PaymentMethod
 * @property {number} id
 * @property {number} userAddressId
 * @property {string} nameOnCard
 * @property {string} type
 * @property {number} last4
 * @property {number} expirationMonth
 * @property {number} expirationYear
 * @property {string} cardNumber
 * @property {type} isPrimary -- eg: 0 | 1
 * @property {Date | string} createdOn - ISO-8601
 * @property {string} systemProvider
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
 * Create a new user
 * @route POST /user/
 * @group User - User APIs
 * @param {User.model} user.body.required - User object is going to be created
 * @returns {User.model} 200 - User object
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 409 - { err: 'DUPLICATE', msg: 'Duplicate entry for key' }
 * @returns {Error} default - Unexpected error
 */

/**
 * Get user by ID
 * @route GET /user/
 * @group User - User APIs
 * @param {number} id.query.required - user Id
 * @returns {User.model} 200 - User
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */

/**
 * Get user details
 * @route GET /user/detail
 * @group User - User APIs
 * @returns {UserDetail.model} 200 - User Details object
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */

/**
 * Get all users
 * @route GET /user/paged
 * @group User - User APIs
 * @returns {Array<User>} 200 - All users
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get all items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */

/**
 * Update an existing user
 * @route PUT /user/
 * @group User - User APIs
 * @param {User.model} user.body.required - User object is going to be updated
 * @returns {User.model} 200 - User object
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission to get all items" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 * @returns {Error} 400 - { err: BAD_REQUEST msg: "Invalid Field" }
 * @returns {Error} default - Unexpected error
 */

/**
 * Login User by username Password
 * @route POST /user/login
 * @group User -User APIs
 * @param {UserLogin.model} body.body.required
 * @returns {Error} 400 - { err: 'BAD_REQUEST', msg: 'value is not a string' }
 * @returns {Error} 401 - { err: 'INCORRECT_EMAIL_OR_PASSWORD' }
 * @returns {UserFiltered.model} 200 - User object
 */

/**
 * Get points transactions for user
 * @route GET /user/points
 * @group User -User APIs
 * @param {number} userId.query.required
 * @returns {Array<UserPoint>} 200 - All applicable point transactions
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */

/**
 * Get user roles
 * @route GET /user/roles
 * @group User - User APIs
 * @returns {Array<UserRole>} 200 - List of user roles
 * @returns {Error} 401 - { err: 'INVALID_TOKEN', msg: 'Invalid Token' }
 * @returns {Error} 403 - { err: FORBIDDEN, msg: "Do not have permission" }
 * @returns {Error} 404 - { err: NOT_FOUND }
 */
