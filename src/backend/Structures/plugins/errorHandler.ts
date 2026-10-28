import type {
	FastifyError,
	FastifyInstance,
	FastifyPluginAsync,
	FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";
import type { User } from "../Database/db-class.js";

// Unhandled errors a route can have before it's taken offline
const MAX_ERRORS = 5;

export type ReportOptions = {
	/** The signed-in user. Attached to the Sentry event only if they allow data collection */
	user?: Pick<User, "id" | "username" | "privacy">;
	/** Counts towards taking the route offline. Defaults to true */
	count?: boolean;
};

/** Logs an error, reports it to Sentry and counts it against the route. Never sends a response. */
export type ReportError = (
	error: unknown,
	request?: FastifyRequest,
	options?: ReportOptions,
) => void;

const routeOf = (request: FastifyRequest) =>
	`${request.routeOptions.method}:${request.routeOptions.url}`;

const errorHandlerPlugin: FastifyPluginAsync = async (
	instance: FastifyInstance,
) => {
	const errorCounts = new Map<string, number>();
	const adminNotified = new Set<string>();

	const reportError: ReportError = (error, request, options = {}) => {
		const route = request ? routeOf(request) : undefined;
		if (route && options.count !== false) {
			errorCounts.set(route, (errorCounts.get(route) ?? 0) + 1);
		}

		instance.log.error(
			{ err: error, route, reqId: request?.id },
			"Unhandled error",
		);
		instance.sentry.withScope((scope) => {
			if (request) {
				scope.setTag("route", route);
				scope.addEventProcessor((event) =>
					instance.sentry.addRequestDataToEvent(event, request.raw, {
						include: { ip: false, user: false },
					}),
				);
			}

			if (options.user?.privacy?.dataCollection) {
				scope.setUser({
					id: options.user.id,
					username: options.user.username,
				});
			}

			instance.sentry.captureException(error);
		});
	};

	instance.decorate("reportError", reportError);

	// A route with too many unhandled errors is taken offline, and admins are told once
	instance.addHook("onRequest", async (request, reply) => {
		const route = routeOf(request);
		if ((errorCounts.get(route) ?? 0) < MAX_ERRORS) {
			return;
		}

		instance.setRouteFailed(route);
		if (!adminNotified.has(route)) {
			adminNotified.add(route);
			instance.log.error(
				`Route ${route} is offline after ${MAX_ERRORS} errors`,
			);
			await instance.db.makeAdminNotify(
				instance.utils.genFolderrId(),
				`Route ${route} is offline after ${MAX_ERRORS} errors`,
				`System Endpoint Failure: ${route}`,
			);
		}

		return reply.code(503).send({
			code: 503,
			message: "This endpoint is offline after repeated errors",
		});
	});

	// The app's only error handler. Client mistakes (e.g. a request that fails its schema)
	// keep their 4xx; they aren't reported or counted, so bad requests can't take a route offline
	instance.setErrorHandler(
		async (error: FastifyError, request: FastifyRequest, reply) => {
			const status = error.statusCode ?? 500;
			if (error.validation || (status >= 400 && status < 500)) {
				return reply
					.code(status)
					.send({ code: status, message: error.message });
			}

			reportError(error, request);
			return reply
				.code(500)
				.send({ code: 500, message: "An internal error occurred" });
		},
	);

	instance.log.debug("Error handler plugin registered");
};

export default fp(errorHandlerPlugin, ">=4.x");
