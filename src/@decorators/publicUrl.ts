export let publicEndpoints = {
	GET: [],
	POST: [],
	PUT: [],
	PATCH: [],
	DELETE: []
};

/**
 * Adds to the public endpoints list
 * @param method - Request method: GET/POST/etc
 * @param path - Path minus /api/v?/ i.e. /user/login
 */
export default function publicUrl(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		if (path.startsWith('/')) path = path.substr(1);
		if (path.endsWith('/')) path = path.substr(0, path.length - 1);
		publicEndpoints[method].push(path);
	};
}
