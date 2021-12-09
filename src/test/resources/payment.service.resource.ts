const usPaymentMethod: Api.Order.Req.PaymentMethods = {
	countryCode: 'US',
	shopperLocale: 'en-US',
	amount: {
		currency: 'USD',
		value: 1000 // $10.00
	}
};

const paymentForm: Api.Payment.Req.Create = {
	cardToken: '',
	pmData: {
		address1: '',
		address2: '',
		callback_url: '',
		card_type: 'visa',
		city: '',
		company: '',
		country: '',
		created_at: '',
		data: undefined,
		eligible_for_card_updater: true,
		email: '',
		errors: [],
		fingerprint: '',
		first_name: '',
		first_six_digits: 123456,
		full_name: '',
		last_four_digits: 1234,
		last_name: '',
		metadata: undefined,
		month: 12,
		number: '',
		payment_method_type: '',
		phone_number: '',
		shipping_address1: '',
		shipping_address2: '',
		shipping_city: '',
		shipping_country: '',
		shipping_phone_number: '',
		shipping_state: '',
		shipping_zip: '',
		state: '',
		storage_state: '',
		test: true,
		token: '',
		updated_at: '',
		verification_value: '',
		year: 2030,
		zip: ''
	},
	offsiteLoyaltyEnrollment: 1
};

const paymentResource = {
	companyId: 1,
	usPaymentMethod,
	paymentForm
};

export default paymentResource;
