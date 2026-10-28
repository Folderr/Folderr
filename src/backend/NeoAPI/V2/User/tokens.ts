import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/account/tokens";
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Lists the signed-in user's API tokens (not the tokens themselves, which Folderr doesn't keep). Needs the website login or a username and password; API tokens can't use this",
			summary: "List API tokens",
			response: {
				"4xx": {
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				200: {
					type: "object",
					properties: {
						message: {
							type: "array",
							items: {
								type: "object",
								properties: {
									created: { type: "number" },
									id: { type: "string" },
									for_user: { type: "string" },
									description: { type: "string" },
								},
							},
						},
						code: { type: "number" },
					},
				},
			},
		},
		async handler(request: FastifyRequest, reply: FastifyReply) {
			const auth = await core.Utils.checkSessionOrPassword(
				request,
				reply,
			);
			if (auth.code !== 200) {
				return reply.status(auth.code).send({
					message: "Authorization failed",
					code: auth.code,
				});
			}

			const tokens = await core.db.findTokens(auth.user.id);
			return reply.status(core.codes.ok).send({
				code: core.codes.ok,
				message: tokens
					.filter((token) => !token.web)
					.map((token) => ({
						created: token.createdAt.getTime(),
						id: token.id,
						for_user: token.userID,
						description: token.description,
					})),
			});
		},
	});
	fastify.log.info(`Initialized GET User Tokens at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	rewrites: "/account/tokens",
	route,
} satisfies NeoRoute;
