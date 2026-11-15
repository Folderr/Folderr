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
			security: [{ apiKey: [] }, { loginCookie: [] }],
			response: {
				"4xx": {
					examples: [
						{ code: 401, message: "Authorization failed." },
						{ code: 403, message: "Action forbidden" },
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				"2xx": {
					examples: [
						{
							code: 200,
							message: {
								users: 42,
								files: 1337,
								links: 256,
								bannedEmails: 3,
								whitelistedEmails: 0,
							},
						},
					],
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
		preHandler: fastify.requireAdmin,
		async handler(_request: FastifyRequest, reply: FastifyReply) {
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
