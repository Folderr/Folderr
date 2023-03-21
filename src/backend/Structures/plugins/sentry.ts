import process from 'process';
import type {Transaction} from '@sentry/types';
import type {FastifyPluginAsync} from 'fastify';
import fp from 'fastify-plugin';
import * as Sentry from '@sentry/node';

declare module 'fastify' {
	/* eslint-disable @typescript-eslint/consistent-type-definitions */
	interface FastifyRequest {
		transaction: Transaction;
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
	options,
) => {
	if (!options.enabled) {
		fastify.setErrorHandler((error, request, reply) => {
			fastify.log.error(error.message || error);

			return reply.status(fastify.codes.internalErr).send({
				error: 'An internal unknown error has occurred',
				code: fastify.codes.internalErr,
			});
		});
		return;
	}

	fastify.setErrorHandler((error, request, reply) => {
		fastify.log.error(error.message || error);

		Sentry.withScope((scope) => {
			scope.addEventProcessor((event) => {
				return Sentry.addRequestDataToEvent(event, request.raw);
			});
			Sentry.captureException(error);
		});

		return reply.status(fastify.codes.internalErr).send({
			error: 'An internal unknown error has occurred',
			code: fastify.codes.internalErr,
		});
	});

	if (process.env.DEBUG) {
		fastify.log.debug('Initiated Sentry plugin');
	}

	fastify.decorate('sentry', Sentry);
	if (!options.tracing) {
		// If the user does not want tracing, no tracing.
		return;
	}

	fastify.decorateRequest('transaction', undefined);
	fastify.addHook('onRequest', (request, reply, done) => {
		// Create a new request scope.
		const hub = Sentry.getCurrentHub();

		// Configure the scope
		hub.configureScope((scope) => {
			scope.addEventProcessor((sentryevent) => {
				Sentry.addRequestDataToEvent(sentryevent, request.raw);
				sentryevent.contexts = {
					...sentryevent.contexts,
					runtime: {
						name: 'node',
						version: 'process.version',
					},
				};
				return sentryevent;
			});
		});

		request.transaction = Sentry.startTransaction({
			name: `${request.method} ${request.url}`,
			op: 'http.server',
			description: `HTTP Request on ${request.url}`,
		});

		request.transaction.setData('request', {
			method: request.method,
			url: request.url,
			agent: request.headers['user-agent'],
		});

		done();
	});

	fastify.addHook('onResponse', (request, reply, done) => {
		const hub = Sentry.getCurrentHub();
		hub.popScope();
		request.transaction.setHttpStatus(reply.statusCode);
		request.transaction.finish();

		done();
	});
};

export default fp(sentryPlugin);
