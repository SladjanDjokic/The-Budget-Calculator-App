import IntegrationCompanyDetails = RedSky.IntegrationCompanyDetails;

const paymentMethods = {
	countryCode: 'US',
	shopperLocale: 'en-US',
	amount: {
		currency: 'USD',
		value: 1000 // $10.00
	}
};

const paymentMethodDetailTypes = ['cardToken', 'text', 'tel', 'select', 'radio', 'emailAddress'];

const companyDetails: IntegrationCompanyDetails = {
	id: 1,
	isActive: 1,
	loyaltyStatus: 'PENDING',
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
	serviceName: 'adyen',
	serviceType: 'PAYMENTS',
	serviceKey:
		'{"apiKey": "AQEphmfuXNWTK0Qc+iSetkkQqPeLQZ9MAZpeQZvlQS/2Uv2HbuVp5K4gB+0QwV1bDb7kfNy1WIxIIkxgBw==-y/1Ym4LlU4F0hkzHpUNcW74YFDXwSDoc5TqwbNda6nQ=-p~r,$;^8A?E=L_qz","merchantAccount":"NDMHospitalityECOM","environment":"TEST","paymentReturnUrl":"https://sand.spireloyalty.com/"}'
};

const adyenResource = {
	companyId: 1,
	paymentMethods,
	paymentMethodDetailTypes,
	companyDetails
};

export default adyenResource;
