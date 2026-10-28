// This is the new path standard for Folderr

import type { FastifyInstance } from "fastify";
import type Core from "../../../Structures/core.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const name = "Ping";
// End path will be formatted something like "/api/v2/info"
const path = "/ping";
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		schema: {
			summary: "Ping!",
			description: "Check if the API is somewhat alive",
			tags: ["public"],
			response: {
				200: {
					examples: [{ message: "Hello World" }],
					type: "object",
					properties: {
						message: { type: "string", value: "Hello World" },
					},
				},
			},
		},
		url: path,
		async handler(_, reply) {
			await reply.send({ message: "Hello World" });
		},
	});
	core.logger.startup(
		`Initialized new API ${name} with method GET and path /api${path}`,
	);
}

export default {
	name,
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
