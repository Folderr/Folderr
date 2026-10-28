import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/admin/:id";
const method = "DELETE";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["management"],
			description:
				"Removes a user's admin status. Only the owner can do this, and the owner can't be demoted",
			summary: "Demote admin",
			security: [{ apiKey: [] }, { loginCookie: [] }],
			params: {
				type: "object",
				properties: {
					id: { type: "string" },
				},
				required: ["id"],
			},
			body: {
				type: "object",
				properties: {
					reason: { type: "string" },
				},
				required: ["reason"],
			},
			response: {
				"4xx": {
					examples: [
						{ code: 401, message: "Authorization failed." },
						{ code: 403, message: "Authorization failed." },
						{
							code: 400,
							message:
								"body must have required property 'reason'",
						},
						{ code: 400, message: "ID is not a valid Folderr ID" },
						{ code: 1054, message: "User not found" },
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
				Body: {
					reason: string;
				};
			}>,
			reply: FastifyReply,
		) {
			const auth = await core.Utils.checkAuth(request, true, true);
			if (auth.code !== 200) {
				return reply.status(auth.code).send({
					code: auth.code,
					message: "Authorization failed.",
				});
			}

			if (!core.Utils.isValidFolderrId(request.params.id)) {
				return reply.status(core.codes.badReq).send({
					code: core.codes.badReq,
					message: "ID is not a valid Folderr ID",
				});
			}

			// Why $nor includes owner: We don't modify the owner's admin status.
			// Why $nor: So we don't get users that aren't admin. This way we only find the user if they
			// 1. Are an admin and, 2. aren't the owner
			const user = await core.db.findAndUpdateUser(
				{
					id: request.params.id,
					$nor: [{ admin: false }, { owner: true }],
				},
				{ admin: false },
				"id username admin",
			);
			if (!user) {
				return reply.status(core.codes.notFound).send({
					message: "User not found",
					code: core.Utils.foldCodes.dbNotFound,
				});
			}

			if (user.admin) {
				return reply.status(core.codes.notAccepted).send({
					message: "Demotion Failed",
					code: core.Utils.foldCodes.dbUnkownError,
				});
			}

			core.logger.info(
				`Administrator removed for ${user.username} (${user.id}) by ${auth.user.username} (${auth.user.id})`,
			);
			return reply.status(core.codes.ok).send({
				code: core.codes.ok,
				message: "OK",
			});
		},
	});
	fastify.log.info(`Initialized DELETE Management Remove Admin at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
