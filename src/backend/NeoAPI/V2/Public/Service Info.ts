// This is the new path standard for Folderr
import type Core from '../../../Structures/core';
import pkg from '../../../../../package.json';
import type {FastifyInstance} from 'fastify'

// We have a name here for in case we decide to map these

export const name = 'Service Info';

// End path will be formatted something like "/api/v2/"
export const path = '/';
export const rewrites = '/';
export const enabled = true;

export function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method: 'GET',
		url: path,
		schema: {
			response: {
				/* eslint-disable @typescript-eslint/naming-convention */
				200: {
					type: 'object',
					properties: {
						message: {
							values: {
								version: {type: 'string'},
								node_version: {type: 'string'},
								online_since: {type: 'number'},
								message: {type: 'string'}
							}
						},
						/* eslint-enable @typescript-eslint/naming-convention */
						code: {type: 'number'}
					}
				}
			}
		},
		handler(request, reply) {
			/* eslint-disable @typescript-eslint/naming-convention */
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
			/* eslint-enable @typescript-eslint/naming-convention */
			return reply.status(fastify.codes.ok).send(out);
		}
	});
	core.logger.startup(`Initialized NEW API ${name} with method GET with path /api/`);
	core.logger.info(`New API ${name} rewrites (and replaces) old endpoint /api${rewrites}`);
}