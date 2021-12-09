import { RsError } from '../utils/errors';

let logRequest = (req, code) => {
	let ip = req.headers['x-forwarded-for'] || '';
	let ip2 = req.connection.remoteAddress || '';
	let ip3 = req.socket.remoteAddress || '';
	// var ip4 = req.connection.socket.remoteAddress || '';
	if (!ip2 || ip2 == '') {
		ip2 = ip3;
	}
	req.ip_address = ip2;
	console.log('%s %s %s', ip2, req.method, req.url, '->', code);
};

let errorHandler = (err, req, res, next) => {
	if (!err) {
		next();
		logRequest(req, 200);
		return;
	}

	logRequest(req, err.err || err.message || err.msg);

	if (err.err === 'CONNECTION_ERROR') {
		// Let the server die so it will try to reconnect to database
		// THIS SHOULD NOT BE AN RsError.
		throw new RsError('CONNECTION_ERROR');
	}

	// If an API request has invalid body we could potentially fail before we have even setup the sendError function
	// thus lets check if its available first.
	if (res.sendError)
		res.sendError(err.err || err.message, err.msg || err.message, err.status || undefined, err.stack);
	else res.status(500).send({ err: 'SERVER_ERROR', msg: 'A server error occurred' });
};

export default (() => {
	return errorHandler;
})();
