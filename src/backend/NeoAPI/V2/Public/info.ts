// This is the new path standard for Folderr
import type Core from '../../../Structures/core';
import type {FastifyInstance} from 'fastify'

export const name = 'Hello World';

// End path will be formatted something like "/api/v2/info"
export const path = '/example';

export const enabled = true;

export function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method: 'GET',
		url: path,
		async handler(_, reply) {
			await reply.send({ message: "Hello World" });
		}
	})
	core.logger.startup(`Initialized new API ${name} with method GET and path /api${path}`)
}