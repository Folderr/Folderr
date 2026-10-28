import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/statistics";
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["admin"],
			description: "Counts the users, files, links and banned emails",
			summary: "Retrieve statistics",
			security: [{ apiKey: [] }],
			response: {
				"4xx": {
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				"2xx": {
					type: "object",
					properties: {
						message: {
							type: "object",
							properties: {
								users: { type: "number" },
								files: { type: "number" },
								links: { type: "number" },
								bannedEmails: { type: "number" },
								whitelistedEmails: { type: "number" },
							},
						},
						code: { type: "number" },
					},
				},
			},
		},
		async handler(request: FastifyRequest, reply: FastifyReply) {
			const auth = await core.Utils.checkAuth(request, true);
			if (auth.code !== 200) {
				return reply.status(auth.code).send({
					code: auth.code,
					message: "Authorization failed.",
				});
			}

			const stats = await core.db.statistics();
			return reply
				.status(core.codes.ok)
				.send({ code: core.codes.ok, message: stats });
		},
	});
	fastify.log.info(`Initialized GET Admin Statistics at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
