import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/admin/:id";
const method = "POST";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["management"],
			description: "Makes a user an admin. Only the owner can do this",
			summary: "Promote to admin",
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
			// 1. Aren't an admin and, 2. aren't the owner
			const user = await core.db.findAndUpdateUser(
				{
					id: request.params.id,
					$nor: [{ admin: true }, { owner: true }],
				},
				{ admin: true },
				"id username admin",
			);
			if (!user) {
				return reply.status(core.codes.notFound).send({
					message: "User not found",
					code: core.Utils.foldCodes.dbNotFound,
				});
			}

			if (!user.admin) {
				return reply.status(core.codes.notAccepted).send({
					message: "Promotion Failed",
					code: core.Utils.foldCodes.dbUnkownError,
				});
			}

			// Eventually we'll make an audit log that goes here
			// So all admins can see what every user has done.
			core.logger.info(
				`Administrator privileges granted to ${user.username} (${user.id}) by ${auth.user.username} (${auth.user.id})`,
			);
			return reply
				.status(core.codes.ok)
				.send({ code: core.codes.ok, message: "OK" });
		},
	});
	fastify.log.info(`Initialized POST Management Add Admin at ${path}`);
}

// remove-admin.ts rewrites the same path, so both legacy routes are replaced together
export default {
	enabled: true,
	method,
	path,
	rewrites: "/manage/admin/:id",
	route,
} satisfies NeoRoute;
