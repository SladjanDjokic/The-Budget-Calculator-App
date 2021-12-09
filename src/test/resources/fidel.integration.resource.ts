const paymentMethod: Model.UserPaymentMethod = {
	id: 33,
	userId: 1,
	userAddressId: null,
	token: 'UGKGRCMzlN8ltImArGoaKPAvCfj',
	nameOnCard: 'Tanner Barney',
	type: 'visa',
	last4: 4321,
	expirationMonth: 3,
	expirationYear: 2030,
	cardNumber: 'XXXX-XXXX-XXXX-4321',
	isPrimary: 0,
	createdOn: '2021-05-26 21:06:34',
	systemProvider: 'adyen',
	metaData:
		'{"cardToken":"WJBx8MR77tExz1xbckjWrBBtaF7","token":"WJBx8MR77tExz1xbckjWrBBtaF7","created_at":"2021-05-20T21:06:25Z","updated_at":"2021-05-20T21:06:25Z","email":null,"data":null,"storage_state":"cached","test":false,"metadata":null,"callback_url":null,"last_four_digits":"4123","first_six_digits":"444400","card_type":"visa","first_name":"Tanner","last_name":"Barney","month":1,"year":2030,"address1":null,"address2":null,"city":null,"state":null,"zip":null,"country":null,"phone_number":null,"company":null,"full_name":"Tanner Barney","eligible_for_card_updater":true,"shipping_address1":null,"shipping_address2":null,"shipping_city":null,"shipping_state":null,"shipping_zip":null,"shipping_country":null,"shipping_phone_number":null,"payment_method_type":"credit_card","errors":[],"fingerprint":"5d4ca4a6d0de0f5179d567738c0cf9bd2f6c","verification_value":"XXX","number":"XXXX-XXXX-XXXX-4123","userId":1}'
};
// For testing against Prod
// const paymentMethod: Model.UserPaymentMethod = {
// 	id: 632,
// 	userId: 2,
// 	userAddressId: null,
// 	token: 'Muv9mfgYOTGw1IuBFNmuvV8RmEX',
// 	nameOnCard: 'Tester Testington',
// 	type: 'visa',
// 	last4: 1111,
// 	expirationMonth: 3,
// 	expirationYear: 2030,
// 	cardNumber: 'XXXX-XXXX-XXXX-1111',
// 	isPrimary: 0,
// 	createdOn: '2021-10-12 23:33:45',
// 	systemProvider: 'spreedly',
// 	metaData:
// 		'{"cardToken":"Muv9mfgYOTGw1IuBFNmuvV8RmEX","token":"Muv9mfgYOTGw1IuBFNmuvV8RmEX","created_at":"2021-10-12T23:33:45Z","updated_at":"2021-10-12T23:33:45Z","email":null,"data":null,"storage_state":"cached","test":true,"metadata":null,"callback_url":null,"last_four_digits":"1111","first_six_digits":"411111","card_type":"visa","first_name":"Tester","last_name":"Testington","month":3,"year":2030,"address1":null,"address2":null,"city":null,"state":null,"zip":null,"country":null,"phone_number":null,"company":null,"full_name":"Tester Testington","eligible_for_card_updater":true,"shipping_address1":null,"shipping_address2":null,"shipping_city":null,"shipping_state":null,"shipping_zip":null,"shipping_country":null,"shipping_phone_number":null,"payment_method_type":"credit_card","errors":[],"fingerprint":"b29950b63b419bfadfba0143703fa90c3354","verification_value":"XXX","number":"XXXX-XXXX-XXXX-1111","userId":2,"isPrimary":0,"offsiteLoyaltyEnrollment":0}'
// };

const companyDetails: RedSky.IntegrationCompanyDetails = {
	id: 1,
	name: 'Red Sky',
	squareLogoUrl: null,
	wideLogoUrl: null,
	description: null,
	createdOn: '2020-12-12 10:00:40',
	modifiedOn: '2020-12-12 17:04:10',
	vanityUrls: [
		'sand.spireloyalty.com/',
		'sand-admin.spireloyalty.com/',
		'prod-admin.spireloyalty.com/',
		'spireloyalty.com/'
	],
	privacyPolicyUrl: null,
	termsConditionsUrl: null,
	returnPolicyUrl: null,
	address: null,
	city: null,
	state: null,
	zip: null,
	country: null,
	serviceType: 'OFFISTE_LOYALTY',
	serviceName: 'fidel',
	serviceKey:
		'{"baseUrl":"https://api.fidel.uk/v1","apiPrivateKey":"sk_test_c16b3893-186d-42ae-919c-1468d7e4df67","apiPublicKey":"pk_test_04722480-d45c-4a30-abf7-840f338e21ae","receiver": {"company_name": "Fidel","receiver_type": "fidel","token": "2rUvg7oMQzpFDytt13Il7eet4mH","hostnames": "https://api.fidel.uk","state": "retained","created_at": "2021-05-20T20:41:36Z","updated_at": "2021-05-20T20:41:36Z","credentials": [{"name": "fidel-key","safe": false}],"ssl_certificate_token": null},"programId":"bc0a942a-ce4f-4664-bce3-df169c18b324"}'
	// For testing against Prod
	// serviceKey: `{
	// 		"baseUrl": "https://api.fidel.uk/v1",
	// 		"apiPrivateKey": "sk_live_f4216b84-4d98-49ed-b2e6-a8022a7b1a51",
	// 		"apiPublicKey": "pk_live_e6745a9d-569e-4fa7-9c39-b3d696f8d82a",
	// 		"receiver": {
	// 			"company_name": "Fidel",
	// 			"receiver_type": "fidel",
	// 			"token": "TG7vcbzgOXvO4rTALjjdpFKpfhu",
	// 			"hostnames": "https://api.fidel.uk",
	// 			"state": "retained",
	// 			"created_at": "2021-10-12T18:36:02Z",
	// 			"updated_at": "2021-10-12T18:36:02Z",
	// 			"credentials": [
	// 				{
	// 					"name": "fidel-key",
	// 					"safe": false
	// 				}
	// 			],
	// 			"ssl_certificate_token": null
	// 		},
	// 		"programId": "bc0a942a-ce4f-4664-bce3-df169c18b324"
	// 	}`
};

const fidelResource = {
	paymentMethod,
	companyDetails
};

export default fidelResource;
