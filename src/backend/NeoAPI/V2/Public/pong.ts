// This is the new path standard for Folderr
import type Core from '../../../Structures/core';
import pkg from '../../../../../package.json';
import type {FastifyInstance} from 'fastify'

export const name = 'INFO';

// end path will be formatted something like "/api/v2/"
export const path = '/';
export const rewrites = '/';
export const enabled = true;

export function route(fastify: FastifyInstance, core: Core) {
	console.log(fastify.prefix);
	fastify.route({
		method: 'GET',
		url: path,
		schema: {
			response: {
				200: {
					type: 'object',
					properties: {
						message: {
							values: {
								version: {type: 'string'},
								node_version: {type: 'string'},
								online_since: {type: 'number'},
								message: {type: 'pong'}
							}
						},
						code: {type: 'number'}
					}
				}
			}
		},
		handler: function(request, reply) {
			const out: {
				message: {
					version: string;
					node_version: string;
					online_since: number;
					message: string;
				};
				code: number;
			} = {
				message: {
					version: pkg.version,
					node_version: process.version,
					online_since: new Date(Date.now() - process.uptime() * 1000).getTime(),
					message: 'Pong!'
				},
				code: this.codes.ok
			};
			return reply.status(fastify.codes.ok).send(out);
		}
	});
	core.logger.startup(`Initialized NEW API Pong with method GET with path /api/`);
}