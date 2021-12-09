////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// The ApiSpecs module uses express-swagger-generator. This will host a website at the following url:
// http://localhost:3001/api-docs
import { Express } from 'express';
import config from '../utils/config';
const Swagger = require('express-swagger-generator');
let host = config?.isLocalHost ? 'localhost:3001' : docsHostName();

function docsHostName() {
	return config.isProduction ? 'spireloyalty.com' : 'sand.spireloyalty.com';
}

export default class ApiSpecs {
	app: Express;
	expressSwagger: any;
	constructor(app) {
		if (!app) throw new Error('express app must be specified.');
		this.app = app;
		this.expressSwagger = new Swagger(this.app);
	}

	init() {
		let options = {
			swaggerDefinition: {
				info: {
					description: 'REST API specification powered by Swagger and Doctrine parser',
					title: 'Rest API',
					version: '1.0.0'
				},
				host,
				basePath: '/api/v1',
				produces: ['application/json'],
				schemes: ['https'],
				securityDefinitions: {
					user_token: {
						type: 'apiKey',
						in: 'header',
						name: 'token',
						description: 'User Authorization token'
					}
				},
				security: [
					{
						user_token: []
					}
				]
			},
			basedir: __dirname, // app absolute path
			files: ['./endpoints/**/*.docs.js'] // Path to the API comment spec folder
		};
		this.expressSwagger(options);
	}
}
