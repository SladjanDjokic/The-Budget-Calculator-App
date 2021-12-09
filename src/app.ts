import { resourceFinder } from './middleware/resourceFinder';

global.ENV = () => {
	const ENV = process.env.DEPLOY_ENVIRONMENT || 'prod';
	console.log(ENV);
	return ENV;
};
import path from 'path';
global.appRoot = path.resolve(__dirname);

import cors from 'cors';
import express from 'express';
import * as httpModule from 'http';
import socketio from 'socket.io';
import compression from 'compression';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import dbSingleton from './database/dbSingleton';
import { authenticate } from './middleware/authenticate';
import errorHandler from './middleware/errorHandler';
import xssFilter from './middleware/xssFilter';
import addPromises from './utils/AddMysqlPromises';
import MetaTools from './database/MetaTools';
import conn from './database/connection';
import { dbUtils } from './database/dbUtils';
import apiIndex from './api/index';
import config from './utils/config';
import ApiSpecs from './api/ApiSpecs';
import rateLimiterMiddleware from './middleware/rateLimiterMiddleware';
import { auditInit, auditCount, auditApi } from './middleware/audit';
import { findCompany } from './middleware/findCompany';
import logger from './utils/logger';
import serviceFactory from './services/serviceFactory';
import Sockets from './sockets';
import endpointValidation from './middleware/apiValidation/apiValidation';
import validationFactory from './middleware/apiValidation/ValidationFactory';
import cronTaskList from './crons/cronTaskList';
import monitorReqMetrics from './utils/monitorReqMetrics';
import { companyUserRole } from './middleware/companyUserRole';
const versionCheck = require('./middleware/versionCheck');

let startTime = Date.now();

const app = express();
app.use(compression());
app.use(helmet()); // Helmet can help protect your app from some well-known web vulnerabilities by setting HTTP headers appropriately
if (config.rateLimiter.enabled) {
	app.use(rateLimiterMiddleware); // Prevent brute-force attacks
}

app.use(bodyParser.json({ limit: '32mb' }));
app.use(bodyParser.urlencoded({ limit: '32mb', extended: false }));

const port = config.application.port;
const connection = addPromises(conn());
app.use(cors({ origin: '*' }));

const server = new httpModule.Server(app);
const io = socketio(server);

(async () => {
	const metaTools = new MetaTools(connection);
	await metaTools.calc_all_metadata();
	logger.info('metadata calculated');
	dbSingleton.create(connection, metaTools);

	const database = dbSingleton.get();
	const dbUtil = dbUtils(connection);
	await dbUtil.init(metaTools.all());
	serviceFactory.create();
	validationFactory.create();
	cronTaskList.startCronTasks();

	const sockets = Sockets({ db: database, io: io });
	const pm2InstanceNumber = parseInt(process.env.NODE_APP_INSTANCE) || 0;
	server
		.listen(port + pm2InstanceNumber, () => {
			let mode = 'SANDBOX';
			if (config.isProduction) mode = 'PRODUCTION';
			logger.info(`Listening http://localhost:${port + pm2InstanceNumber} in ${mode} mode`);
			logger.info('Time to server start: ' + (Date.now() - startTime) / 1000.0 + ' seconds');
			server.emit('app_started'); // Emit 'app_started' to notify subscribers to the event.
		})
		.on('error', (err) => {
			logger.error(err);
			throw err;
		});

	app.use('/', findCompany);
	app.use('/api', monitorReqMetrics());
	app.use('/api', auditCount);
	app.use('/api', versionCheck);
	app.use('/api', authenticate);
	app.use('/api', companyUserRole);
	app.use('/api', resourceFinder);
	app.use('/api', endpointValidation);
	app.get('/api/v1/audit', auditApi);
	app.use('/api', xssFilter);

	// app.use('/admin', express.static(__dirname + '/admin'));
	app.get('/', xssFilter);

	apiIndex(app);
	app.use('/api', errorHandler);
	auditInit(app?._router?.stack);

	new ApiSpecs(app).init();
})();

export default (function () {
	return server;
})();
