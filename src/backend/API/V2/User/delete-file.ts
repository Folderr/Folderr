import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/file/:id";
const method = "DELETE";

type RouteTypes = {
	Params: {
		id: string;
	};
};

function route(fastify: FastifyInstance, core: Core) {
	fastify.route<RouteTypes>({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Deletes one of the signed-in user's uploads, including the file itself",
			summary: "Delete upload",
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
						{ code: 1054, message: "File not found!" },
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
		preHandler: fastify.requireUser,
		async handler(
			request: FastifyRequest<RouteTypes>,
			reply: FastifyReply,
		) {
			const auth = fastify.requestUser(request);

			const file = await core.db.findFile({
				owner: auth.id,
				id: request.params.id,
			});
			if (!file) {
				return reply.status(core.codes.notFound).send({
					code: core.Utils.foldCodes.dbNotFound,
					message: "File not found!",
				});
			}

			// purgeFile removes the record and the file on disk
			await core.db.purgeFile({ id: file.id, owner: auth.id });
			return reply
				.status(core.codes.ok)
				.send({ code: core.codes.ok, message: "OK" });
		},
	});
	fastify.log.info(`Initialized DELETE User File at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
