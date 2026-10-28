import type {
	FastifyError,
	FastifyInstance,
	FastifyPluginAsync,
	FastifyPluginOptions,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";

interface ErrorCounts {
	[route: string]: number;
}

const MAX_ERRORS = 5; // Define the maximum number of errors allowed

export type ErrorHandlerWithSeverity = (
	error: Error,
	request: FastifyRequest,
	reply: FastifyReply,
	severity?: string,
) => Promise<FastifyReply>;
export type supressErrorHandlerRoute = (route: string) => void;

const errorHandlerPlugin: FastifyPluginAsync = async (
	instance: FastifyInstance,
	_: FastifyPluginOptions,
) => {
	const errorCounts: ErrorCounts = {};
	const adminNotified = new Set<string>();
	const supressedRoutes = new Set<string>();

	// Function to send notification to admins
	const sendNotificationToAdmins = async (route: string) => {
		if (adminNotified.has(route)) {
			return;
		}
		// Replace this with your actual notification logic
		instance.log.error(
			`Route ${route} is offline due to more than ${MAX_ERRORS} errors`,
		);
		await instance.db.makeAdminNotify(
			instance.utils.genFolderrId(),
			`Route ${route} is offline due to more than ${MAX_ERRORS} errors`,
			`System Endpoint Failure: ${route}`,
		);
		adminNotified.add(route);
	};

	instance.addHook("onRequest", async (request, reply) => {
		const route = `${request.routeOptions.method}:${request.routeOptions.url}`;

		if (!errorCounts[route]) {
			errorCounts[route] = 0;
		}

		// Check if the error count for the route has exceeded the maximum
		if (errorCounts[route] >= MAX_ERRORS) {
			instance.setRouteFailed(route);
			await sendNotificationToAdmins(route); // Send notification to admins
			reply.code(503).send({ error: "Service Unavailable", code: 503 });
			return;
		}
	});

	/**
	 * @desc Handles a server-side failure: logs it, reports it to Sentry, counts it towards
	 * taking the route offline, and answers with a generic 500 that doesn't leak the error.
	 */
	const handlerWithSeverity = async (
		error: Error,
		request: FastifyRequest,
		reply: FastifyReply,
		severity?: string,
	): Promise<FastifyReply> => {
		const route = `${request.routeOptions.method}:${request.routeOptions.url}`;
		if (supressedRoutes.has(route)) {
			return reply;
		}

		if (severity === "fatal" || !severity) {
			errorCounts[route] = (errorCounts[route] ?? 0) + 1;
		}

		instance.log.error(error, `Error occurred on route ${route}`);
		instance.sentry.withScope((scope) => {
			scope.addEventProcessor((event) =>
				instance.sentry.addRequestDataToEvent(event, request.raw),
			);
			instance.sentry.captureException(error);
		});

		return reply.code(500).send({
			code: 500,
			message: "An internal error occurred",
		});
	};

	/**
	 * @desc The app's only error handler. Client mistakes, such as a request that fails its
	 * schema, keep their 4xx status and message; they aren't server errors, so they're not
	 * reported or counted (otherwise bad requests alone could take a route offline).
	 */
	const errorHandler = async (
		error: FastifyError,
		request: FastifyRequest,
		reply: FastifyReply,
	) => {
		const status = error.statusCode ?? 500;
		if (error.validation || (status >= 400 && status < 500)) {
			return reply
				.code(status)
				.send({ code: status, message: error.message });
		}

		return handlerWithSeverity(error, request, reply);
	};

	instance.decorate("handleError", handlerWithSeverity);
	instance.decorate("supressErrorHandlerRoute", (route: string) => {
		// instance.log.debug("Supressing route " + route);
		supressedRoutes.add(route);
	});

	instance.setErrorHandler(errorHandler);

	instance.log.debug(
		"ErrorHandler plugin registered for instance with prefix: " +
			instance.prefix,
	);
};

export default fp(errorHandlerPlugin, ">=4.x");
