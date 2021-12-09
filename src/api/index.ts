import fs from 'fs';
import path from 'path';
import apiDocumentation from '../utils/apiDocumentation';
import apiFactory from './apiFactory';
import { Application } from 'express';
import { GeneralApiArgs } from './GeneralApi';
import logger from '../utils/logger';

let wrapAsync = (fn) => {
	return (req, res, next) => {
		// Make sure to `.catch()` any errors and pass them along to the `next()`
		// middleware in the chain, in this case the error handler.
		fn(req, res, next).catch(next);
	};
};

/**
 * Requires every *.api* file in the endpoints directory
 * @param app : Express Application (Need 5.0+ to get catch handling)
 */
export default (app: Application) => {
	const exceptions = ['app_info'];
	let apiObj = {};

	let asyncApp: any = {
		get: function (url, fn, arg3) {
			if (arg3) {
				app.get(url, fn, wrapAsync(arg3));
			} else {
				app.get(url, wrapAsync(fn));
			}
		},
		post: function (url, fn, arg3) {
			if (arg3) {
				app.post(url, fn, wrapAsync(arg3));
			} else {
				app.post(url, wrapAsync(fn));
			}
		},
		put: function (url, fn, arg3) {
			if (arg3) {
				app.put(url, fn, wrapAsync(arg3));
			} else {
				app.put(url, wrapAsync(fn));
			}
		},
		delete: function (url, fn, arg3) {
			if (arg3) {
				app.delete(url, fn, wrapAsync(arg3));
			} else {
				app.delete(url, wrapAsync(fn));
			}
		},
		patch: function (url, fn, arg3) {
			if (arg3) {
				app.patch(url, fn, wrapAsync(arg3));
			} else {
				app.patch(url, wrapAsync(fn));
			}
		}
	};
	fs.readdirSync(path.join(__dirname, 'endpoints')).forEach(includeAllFiles);

	function includeAllFiles(file) {
		if (file.endsWith('.api.js') === false) return;
		let name = file.substr(0, file.indexOf('.'));
		let Api = apiFactory(name);
		if (!Api) {
			logger.error(
				`ERROR: ${file} was in endpoints folder but there was not an appropriate api Factory class. Exiting!`
			);
			throw new Error('Missing api factory class');
		}
		if (name && !exceptions.includes(name)) {
			const apiArgs: GeneralApiArgs = {
				app: asyncApp,
				endpointBaseName: name
			};
			apiObj[name] = new Api(apiArgs);
			apiDocumentation.add(Api, name);
		} else if (name) {
			const apiArgs: GeneralApiArgs = {
				app: asyncApp,
				endpointBaseName: name
			};
			apiObj[name] = new Api(apiArgs);
		}
	}
	return apiObj;
};
