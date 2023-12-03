// This is the new path standard for Folderr
import type Core from '../../../Structures/core';
import type {FastifyInstance} from 'fastify'

export const name = 'INFO';

// end path will be formatted something like "/api/v2/info"
export const path = '/example';

export const enabled = true;

export function route(fastify: FastifyInstance, core: Core) {
	console.log(fastify.prefix);
	fastify.route({
		method: 'GET',
		url: path,
		handler: function(request, reply) {
			reply.send({ message: "Hello World" });
		}
	})
}