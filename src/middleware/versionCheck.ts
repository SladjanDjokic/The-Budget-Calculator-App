const minEnabledVersions: object = {
	5: versionConvert('1.0.0')
};

function versionConvert(versionString: string) {
	let versionSplit = versionString.split('.');
	let versionValue = 0;
	let versionMultiplier = 1;
	for (let i = versionSplit.length - 1; i >= 0; i--) {
		versionValue = versionValue + parseInt(versionSplit[i]) * versionMultiplier;
		versionMultiplier *= 1000;
	}
	return versionValue;
}

module.exports = (req, res, next) => {
	if (!req.headers['company-id']) return next();
	let minEnabledVersion = minEnabledVersions[req.headers['company-id']];
	if (!minEnabledVersion) return next();
	let version = req.headers.version;
	let mobile = req.headers.mobile_app == 'true';
	if (mobile && versionConvert(version) < minEnabledVersion) {
		return res.status(418).send({ err: 'you need to update', message: 'you need to update' });
	}
	next();
};
