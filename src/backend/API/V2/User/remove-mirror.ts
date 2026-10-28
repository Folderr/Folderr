import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/account/mirror";
const method = "DELETE";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Unlinks a mirror (custom URL) from the signed-in user's account",
			summary: "Remove mirror",
			security: [{ apiKey: [] }],
			body: {
				type: "object",
				properties: {
					mirror: { type: "string" },
				},
				required: ["mirror"],
			},
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
						message: { type: "string" },
						code: { type: "number" },
					},
				},
			},
		},
		async handler(
			request: FastifyRequest<{
				Body: {
					mirror: string;
				};
			}>,
			reply: FastifyReply,
		) {
			const auth = await core.Utils.checkAuth(request);
			if (auth.code !== 200) {
				return reply.status(auth.code).send({
					code: auth.code,
					message: "Authorization failed.",
				});
			}

			if (!auth.user.cURLs.includes(request.body.mirror)) {
				return reply.status(core.codes.notFound).send({
					code: core.Utils.foldCodes.dbNotFound,
					message: "Mirror not linked!",
				});
			}

			await core.db.updateUser(
				{ id: auth.user.id },
				{
					$pull: {
						cURLs: request.body.mirror,
					},
				},
			);
			return reply.status(core.codes.ok).send({
				code: core.codes.ok,
				message: "OK",
			});
		},
	});
	fastify.log.info(`Initialized DELETE User Remove Mirror at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
