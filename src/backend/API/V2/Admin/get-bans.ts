import type { FastifyInstance } from "fastify";
import type Core from "../../../Structures/core.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/bans";
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["admin"],
			description: "Shows all emails that are banned",
			summary: "Retrieve bans",
			security: [{ apiKey: [] }, { loginCookie: [] }],
			// How do you camelCase a number?
			response: {
				200: {
					examples: [
						{
							code: 200,
							message: [
								{
									id: "01JB8Z6Q3K4M9T2V7XWYH5N0RC",
									email: "spammer@example.com",
									reason: "Uploading malware",
									createdAt: 1730073600000,
								},
							],
						},
						{ code: 1054, message: [] },
					],
					type: "object",
					properties: {
						message: {
							type: "array",
							uniqueItems: true,
							items: {
								type: "object",
								properties: {
									reason: { type: "string" },
									email: { type: "string" },
									createdAt: { type: "integer" },
									id: { type: "string" },
								},
								required: [
									"reason",
									"email",
									"createdAt",
									"id",
								],
							},
						},
						code: { type: "number" },
					},
				},
				default: {
					examples: [
						{ code: 401, message: "Authorization failed." },
						{ code: 403, message: "Action forbidden" },
						{
							code: 1053,
							message: "Unknown Error While Fetching Bans",
						},
					],
					type: "object",
					properties: {
						message: {
							type: "string",
						},
						code: { type: "number" },
					},
				},
			},
		},
		preHandler: fastify.policy.requireAdmin,
		async handler(request, reply) {
			const bans = await core.db.getBans();

			if (bans.length === 0) {
				return await reply.code(request.server.codes.ok).send({
					code: core.Utils.foldCodes.dbNotFound,
					message: [],
				});
			}

			return await reply.code(request.server.codes.ok).send({
				code: request.server.codes.ok,
				message: bans,
			});
		},
	});
	fastify.log.info(undefined, "Initialized GET bans");
}

export default {
	path,
	method,
	enabled: true,
	route,
} satisfies NeoRoute;
