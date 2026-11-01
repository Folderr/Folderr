import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/link/:id";
const method = "DELETE";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description: "Deletes one of the signed-in user's short links",
			summary: "Delete link",
			security: [{ apiKey: [] }, { loginCookie: [] }],
			params: {
				type: "object",
				properties: {
					id: { type: "string" },
				},
				required: ["id"],
			},
			response: {
				"4xx": {
					examples: [
						{ code: 401, message: "Authorization failed." },
						{ code: 1054, message: "Link not found!" },
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				200: {
					examples: [{ code: 200, message: "OK" }],
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
				Params: {
					id: string;
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

			const short = await core.db.purgeLink({
				id: request.params.id,
				owner: auth.user.id,
			});
			if (!short) {
				return reply.status(core.codes.notFound).send({
					code: core.Utils.foldCodes.dbNotFound,
					message: "Link not found!",
				});
			}

			return reply
				.status(core.codes.ok)
				.send({ code: core.codes.ok, message: "OK" });
		},
	});
	fastify.log.info(`Initialized DELETE User Link at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
