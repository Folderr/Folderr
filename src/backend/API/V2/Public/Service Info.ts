// This is the new path standard for Folderr

import type { FastifyInstance } from "fastify";
import pkg from "../../../../../package.json" with { type: "json" };
import type Core from "../../../Structures/core.js";
import type { NeoRoute } from "../../../Structures/neo-route";

// We have a name here for in case we decide to map these
const name = "Service Info";

// End path will be formatted something like "/api/v2/"
const path = "";
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			summary: "Retrieve basic API information",
			tags: ["public"],
			description:
				"Sends back basic information about the Folderr API, including an enabled feature-set",
			response: {
				200: {
					type: "object",
					properties: {
						message: {
							properties: {
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
								failedEndpoints: {
									type: "array",
									items: { type: "string" },
								},
							},
						},
						code: { type: "number" },
					},
				},
			},
		},
		handler(_request, reply) {
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
					failedEndpoints: string[];
				};
				code: number;
			} = {
				message: {
					version: pkg.version,
					node_version: process.version,
					online_since: new Date(
						Date.now() - process.uptime() * 1000,
					).getTime(),
					message: "Pong!",
					features: {
						dns_mirror: false,
						emailer: core.emailer.active,
						signups: core.config.signups as 0 | 1 | 2,
					},
					failedEndpoints: Array.from(
						core.getHealth().failedEndpoints,
					),
				},
				code: this.codes.ok,
			};
			return reply.status(fastify.codes.ok).send(out);
		},
	});
	core.logger.startup(
		`Initialized NEW API ${name} with method GET with path /api/`,
	);
}

export default {
	path,
	name,
	enabled: true,
	method,
	route,
} satisfies NeoRoute;
