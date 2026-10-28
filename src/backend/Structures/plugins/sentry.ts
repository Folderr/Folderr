import * as Sentry from "@sentry/node";
import type { Span, Transaction } from "@sentry/types";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import process from "process";

declare module "fastify" {
	interface FastifyRequest {
		transaction: Transaction;
		span?: Span;
	}

	interface FastifyInstance {
		sentry: typeof Sentry;
	}
}

type SentryOptions = {
	enabled: boolean;
	tracing: boolean;
};

const sentryPlugin: FastifyPluginAsync<SentryOptions> = async (
	fastify,
	options,
) => {
	// Always available, so code can report errors without checking first. Sentry's functions
	// do nothing until Sentry.init has run with a DSN. Errors are reported by the errorHandler
	// plugin, which is the app's only error handler.
	fastify.decorate("sentry", Sentry);

	if (!options.enabled) {
		return;
	}

	if (process.env.DEBUG) {
		fastify.log.debug("Initiated Sentry plugin");
	}

	if (!options.tracing) {
		// If the user does not want tracing, no tracing.
		return;
	}

	fastify.decorateRequest("transaction");
	fastify.addHook("onRequest", (request, _, done) => {
		// Configure the scope
		const scope = Sentry.getCurrentScope() as Sentry.Scope;
		scope.addEventProcessor((sentryevent) => {
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
			},
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

export default fp(sentryPlugin as FastifyPluginAsync);
