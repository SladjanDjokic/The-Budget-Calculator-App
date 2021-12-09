/**
 * Audit.ts - A middleware auditing system using redis.
 * Audit is middleware that checks against registered routes with Express and increments its call count
 * On startup audit will check for new registered routes with Express and place them in redis with a default value (0)
 * Each time an api endpoint is called, we call into redis and increment the route with the given key.
 * -------------------------------------------------------
 * Key Schema
 * ---
 * <env>api-audit-<req.method>:<registered route>
 *     env - sand_ (Sandbox), '' (Production)
 * Example
 * ---
 * Sandbox - sand_api-audit-GET:/api/v1/user/get
 * Production - api-audit-GET:/api/v1/user/get
 */

import config from '../utils/config';
import redis from '../integrations/redis/client';
import logger from '../utils/logger';
import { ObjectUtils } from '../utils/utils';
import UserService from '../services/user/user.service';
import serviceFactory from '../services/serviceFactory';
const baseRoute = 'api-audit';

export interface RouteData {
	route: string;
	count: number;
}

export interface RsRoute {
	route: {
		path: string;
		stack: any;
		methods: RouteMethod;
	};
}

interface RouteMethod {
	post?: boolean;
	get?: boolean;
	put?: boolean;
	patch?: boolean;
	delete?: boolean;
}

type FormattedHttpMethods = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/**
 * auditInit - Ran on startup to initialize all registered routes in redis cache with a default value
 * @param routes - RsRoute
 * @return void
 */
export async function auditInit(routes: RsRoute[]) {
	const env = config.isProduction ? '' : 'sand_';
	let redisRoutes: string[] = (await getRoute()) as string[];
	redisRoutes = redisRoutes.map((route) => {
		return route.replace(env, '');
	});
	for (let route of routes) {
		if (!route?.route?.path || !ObjectUtils.isArrayWithData(getHttpMethod(route))) continue;
		const methods: FormattedHttpMethods[] = getHttpMethod(route) as FormattedHttpMethods[];
		for (let method of methods) {
			if (pathExists(redisRoutes, route, method)) continue;
			await setDefaultRoute(route.route.path, method);
			redisRoutes.push(`${baseRoute}-${method}:${route.route.path}`);
		}
	}
}

/**
 * auditCount - call redis.incr to auto-increment the value by 1 or create with key: 0 and then add 1
 * @param req
 * @param res
 * @param next
 * @returns next
 */
export async function auditCount(req, res, next) {
	if (req.method === 'OPTIONS') return next();
	const apiRoute = req.originalUrl.split('?')[0];
	redis.incr(`${baseRoute}-${req.method}:${apiRoute}`);
	next();
}

/**
 * auditReset - delete all of the existing registered audit routes in redis and reset to 0
 * @param routes - RsRoute
 * @return void
 */
export async function auditReset(routes: RsRoute[]) {
	const redisRoutes: string[] = (await getRoute()) as string[];
	for (let route of redisRoutes) {
		await redis.del(route, true);
	}
	auditInit(routes);
}

/**
 * audit - Get all of the route data from redis
 * @return RouteData[]
 */
export async function audit(): Promise<RouteData[]> {
	const redisRoutes: string[] = (await getRoute()) as string[];
	const auditResults: RouteData[] = [];
	for (let route of redisRoutes) {
		const count = ((await redis.get(route, false)) as unknown) as number;
		auditResults.push({ route, count });
	}
	return auditResults;
}

/**
 * auditApi - Run the audit method and return from an api request
 * @param req
 * @param res
 * @return {data: RouteData[]}
 */
export async function auditApi(req, res) {
	const userService: UserService = serviceFactory.get<UserService>('UserService');
	if (!req.user || !(await userService.isAdminOrAbove(req.user))) return res.status(403).send('FORBIDDEN');
	let data = await audit();
	data = ObjectUtils.sort(data, 'count', true);
	res.send({ data });
}

/**
 * pathExists - See if path api path exists in redis cache
 * @param redisRoutes
 * @param route - RsRoute
 * @param method - FormattedHttpMethods
 * @return boolean
 */
function pathExists(redisRoutes: string[], route: RsRoute, method: FormattedHttpMethods) {
	return redisRoutes.includes(`${baseRoute}-${method}:${route.route.path}`);
}

/**
 * getRoute - Gets either a specific route or all routes in redis cache
 * @param route - optional - possibly a route path to pull single record
 * @return string[] | RouteData
 */
async function getRoute(route?: string, method?: FormattedHttpMethods) {
	if (route) {
		return await redis.get(`${baseRoute}-${method}:${route}`);
	} else {
		return await redis.keys(`${baseRoute}*`);
	}
}

/**
 * getHttpMethod - Gets the http method type(s) if exists
 * @param route - RsRoute
 * @return - a string of uppercase http method type(s)
 */
function getHttpMethod(route: RsRoute): string[] {
	const methods: string[] = [];
	if (!ObjectUtils.isArrayWithData(Object.keys(route?.route?.methods))) return methods;
	for (let iterator in route.route.methods) {
		methods.push(iterator.toUpperCase());
	}
	return methods;
}

/**
 * setDefaultRoute - Sets the default route value in redis
 * @param route - registered api route
 * @param method - FormattedHttpMethods
 * @return void
 */
function setDefaultRoute(route: string, method: FormattedHttpMethods) {
	logger.info(`Setting default audit path: ${method}:${route}`);
	return redis.set(`${baseRoute}-${method}:${route}`, 0);
}
