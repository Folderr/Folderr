import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/notification/:id";
const method = "DELETE";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["admin"],
			description:
				"Deletes an admin notification. Signup notifications can't be deleted",
			summary: "Delete admin notification",
			security: [{ apiKey: [] }],
			params: {
				type: "object",
				properties: {
					id: { type: "string" },
				},
				required: ["id"],
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
				Params: {
					id: string;
				};
			}>,
			reply: FastifyReply,
		) {
			const auth = await core.Utils.checkAuth(request, true);
			if (auth.code !== 200) {
				return reply.status(auth.code).send({
					code: auth.code,
					message: "Authorization failed.",
				});
			}

			const notify = await core.db.findAdminNotify({
				id: request.params.id,
			});
			if (!notify) {
				return reply.status(core.codes.notFound).send({
					code: core.Utils.foldCodes.dbNotFound,
					message: "Notification not found!",
				});
			}

			// Signup notifications are invincible, at least to manually remove
			if (notify.title === "New user signup!") {
				return reply.status(core.codes.forbidden).send({
					code: core.codes.forbidden,
					message: "Signup notifications cannot be removed!",
				});
			}

			await core.db.purgeAdminNotify({ id: request.params.id });
			core.logger.info(
				`[SYSTEM] Admin notification ${notify.id} removed by ${auth.user.username}!`,
			);
			return reply
				.status(core.codes.ok)
				.send({ code: core.codes.ok, message: "OK" });
		},
	});
	fastify.log.info(`Initialized DELETE Admin Notification at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
