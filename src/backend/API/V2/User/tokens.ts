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
			security: [{ loginCookie: [] }, { username: [], password: [] }],
			response: {
				"4xx": {
					examples: [{ code: 401, message: "Authorization failed" }],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				200: {
					examples: [
						{
							code: 200,
							message: [
								{
									created: 1730073600000,
									id: "01JB8Z6Q3K4M9T2V7XWYH5N0RC",
									for_user: "01J9W4E7T5H2C8B3N6M1QK0DXF",
									description: "ShareX on my laptop",
								},
								{
									created: 1729987200000,
									id: "01JB7XKD2R8F4N6P1QZ3W9M5TA",
									for_user: "01J9W4E7T5H2C8B3N6M1QK0DXF",
									description: "CLI uploads",
								},
							],
						},
					],
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
	route,
} satisfies NeoRoute;
