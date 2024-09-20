import { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';
import type {MongoDB, Utils} from "../../internals";
import fp from 'fastify-plugin';

interface ErrorCounts {
	[route: string]: number;
}

const MAX_ERRORS = 5; // Define the maximum number of errors allowed

export type ErrorHandlerPluginOpts = {
	database: MongoDB;
	utils: Utils;
};

export type ErrorHandlerWithSeverity = (error: Error, request: FastifyRequest, reply: FastifyReply, severity?: string) => Promise<FastifyReply>;
export type supressErrorHandlerRoute = (route: string) => void;

const errorHandlerPlugin: FastifyPluginAsync<ErrorHandlerPluginOpts> = async (instance: FastifyInstance, options: ErrorHandlerPluginOpts) => {
	if (!options.database) {
		throw new Error('Core instance is required');
	}
	const errorCounts: ErrorCounts = {};
	const adminNotified = new Set<string>();
	const supressedRoutes = new Set<string>();

	const {database, utils} = options

	// Function to send notification to admins
	const sendNotificationToAdmins = async (route: string) => {
		if (adminNotified.has(route)) {
			return;
		}
		// Replace this with your actual notification logic
		instance.log.error(`Route ${route} is offline due to more than ${MAX_ERRORS} errors`);
		await database.makeAdminNotify(utils.genFolderrId(), `Route ${route} is offline due to more than ${MAX_ERRORS} errors`, `System Endpoint Failure: ${route}`);
		adminNotified.add(route);
	};

	instance.addHook('onRequest', async (request, reply) => {
		const route = `${request.routeOptions.method}:${request.routeOptions.url}`;

		if (!errorCounts[route]) {
			errorCounts[route] = 0;
		}

		// Check if the error count for the route has exceeded the maximum
		if (errorCounts[route] >= MAX_ERRORS) {
			await sendNotificationToAdmins(route); // Send notification to admins
			reply.code(503).send({ error: 'Service Unavailable', code: 503 });
			return;
		}
	});

	const handlerWithSeverity = async (error: Error, request: FastifyRequest, reply: FastifyReply, severity?: string): Promise<FastifyReply> => {
		const route = `${request.routeOptions.method}:${request.routeOptions.url}`;
		if (supressedRoutes.has(route)) {
			return reply;
		}

		if (severity === 'fatal' || !severity) {
			errorCounts[route]++;
		}
		instance.log.error(`Error occurred on route ${route}: ${error.message}`);
		return reply.code(500).send({ error: error.message, code: 500 });
	};

	const errorHandler = async (error: Error, request: FastifyRequest, reply: FastifyReply) => {
		return handlerWithSeverity(error, request, reply);
	};

	instance.decorate('handleError', handlerWithSeverity);
	instance.decorate('supressErrorHandlerRoute', (route: string) => {
		// instance.log.debug("Supressing route " + route);
		supressedRoutes.add(route);
	});

	instance.setErrorHandler(errorHandler);

	instance.log.debug('ErrorHandler plugin registered for instance with prefix: ' + instance.prefix);
};

export default fp(errorHandlerPlugin, '4.x');