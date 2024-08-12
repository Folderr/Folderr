// This is the new path standard for Folderr
import type Core from "../../../Structures/core.js";
import pkg from "../../../../../package.json" assert { type: "json" };
import type { FastifyInstance } from "fastify";

// We have a name here for in case we decide to map these

export const name = "Service Info";

// End path will be formatted something like "/api/v2/"
export const path = "/";
export const rewrites = "/";
export const enabled = true;

export function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method: "GET",
		url: path,
		schema: {
			response: {
				/* eslint-disable @typescript-eslint/naming-convention */
				200: {
					type: "object",
					properties: {
						message: {
							values: {
								version: { type: "string" },
								node_version: { type: "string" },
								online_since: { type: "number" },
								message: { type: "string" },
								features: {
									type: "object",
									properties: {
										emailer: { type: "boolean" },
										dns_mirror: { type: "boolean" },
										signups: { type: "number" },
									},
								},
							},
						},
						/* eslint-enable @typescript-eslint/naming-convention */
						code: { type: "number" },
					},
				},
			},
		},
		handler(request, reply) {
			/* eslint-disable @typescript-eslint/naming-convention */
			const out: {
				message: {
					version: string;
					node_version: string;
					online_since: number;
					message: string;
					features: {
						dns_mirror: boolean;
						emailer: boolean;
						signups: 0 | 1 | 2;
					};
				};
				code: number;
			} = {
				message: {
					version: pkg.version,
					node_version: process.version,
					online_since: new Date(
						Date.now() - process.uptime() * 1000
					).getTime(),
					message: "Pong!",
					features: {
						dns_mirror: false,
						emailer: core.emailer.active,
						signups: core.config.signups as 0 | 1 | 2,
					},
				},
				code: this.codes.ok,
			};
			/* eslint-enable @typescript-eslint/naming-convention */
			return reply.status(fastify.codes.ok).send(out);
		},
	});
	core.logger.startup(
		`Initialized NEW API ${name} with method GET with path /api/`
	);
	fastify.log.info(
		`New API ${name} rewrites (and replaces) old endpoint /api${rewrites}`
	);
}
