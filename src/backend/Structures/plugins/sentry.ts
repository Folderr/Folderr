import process from "process";
import type { Transaction, Span } from "@sentry/types";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import * as Sentry from "@sentry/node";

declare module "fastify" {
	/* eslint-disable @typescript-eslint/consistent-type-definitions */
	interface FastifyRequest {
		transaction: Transaction;
		span?: Span;
	}

	interface FastifyInstance {
		sentry: typeof Sentry;
	}
	/* eslint-enable @typescript-eslint/consistent-type-definitions */
}

type SentryOptions = {
	enabled: boolean;
	tracing: boolean;
};

const sentryPlugin: FastifyPluginAsync<SentryOptions> = async (
	fastify,
	options
) => {
	if (!options.enabled) {
		fastify.setErrorHandler((error, _, reply) => {
			fastify.log.error(error.message || error);

			return reply.status(fastify.codes.internalErr).send({
				error: "An internal unknown error has occurred",
				code: fastify.codes.internalErr,
			});
		});
		return;
	}

	fastify.setErrorHandler((error, request, reply) => {
		fastify.log.error(error.message || error);

		Sentry.withScope((scope) => {
			scope.addEventProcessor((event) => {
				// eslint-disable-next-line max-len
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
				return Sentry.addRequestDataToEvent(event, request.raw);
			});
			Sentry.captureException(error);
		});

		return reply.status(fastify.codes.internalErr).send({
			error: "An internal unknown error has occurred",
			code: fastify.codes.internalErr,
		});
	});

	if (process.env.DEBUG) {
		fastify.log.debug("Initiated Sentry plugin");
	}

	fastify.decorate("sentry", Sentry);
	if (!options.tracing) {
		// If the user does not want tracing, no tracing.
		return;
	}

	fastify.decorateRequest("transaction", null);
	fastify.addHook("onRequest", (request, _, done) => {
		// Configure the scope
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const scope = Sentry.getCurrentScope() as Sentry.Scope;
		scope.addEventProcessor((sentryevent) => {
			// eslint-disable-next-line max-len
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
			Sentry.addRequestDataToEvent(sentryevent, request.raw);
			sentryevent.contexts = {
				...sentryevent.contexts,
				runtime: {
					name: "node",
					version: "process.version",
				},
			};
			return sentryevent;
		});

		Sentry.startSpan(
			{
				name: `${request.method} ${request.url}`,
				op: "http.server",
				description: `HTTP Request on ${request.url}`,
			},
			(span) => {
				if (!span) return;

				request.span = span;
			}
		);

		if (request.span) {
			request.span.setAttributes({
				method: request.method,
				url: request.url,
				agent: request.headers["user-agent"],
			});
		}

		done();
	});

	fastify.addHook("onResponse", (request, reply, done) => {
		if (!request.span) {
			done();
		} else {
			Sentry.setHttpStatus(request.span, reply.statusCode);
			request.span.end();

			done();
		}
	});
};

export default fp(sentryPlugin);
