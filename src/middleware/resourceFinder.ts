import { UserAgent } from 'express-useragent';

export async function resourceFinder(req, res, next) {
	if (!req.useragent) return next();
	const userAgent: UserAgent = req.useragent;
	if (userAgent.isMobile && userAgent.isAndroid) req.internalResource = 'ANDROID';
	if (userAgent.isMobile && !userAgent.isAndroid) req.internalResource = 'IOS';
	if (!userAgent.isMobile) req.internalResource = 'WEB';
	return next();
}
