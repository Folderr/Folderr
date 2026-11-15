import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/admin/:id";
const method = "DELETE";

type RouteTypes = {
	Params: {
		id: string;
	};
	Body: {
		reason: string;
	};
};

function route(fastify: FastifyInstance, core: Core) {
	fastify.route<RouteTypes>({
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
						{ code: 403, message: "Action forbidden" },
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
		preHandler: fastify.requireOwner,
		async handler(
			request: FastifyRequest<RouteTypes>,
			reply: FastifyReply,
		) {
			const auth = fastify.requestUser(request);

			if (!core.Utils.isValidFolderrId(request.params.id)) {
				return reply.status(core.codes.badReq).send({
					code: core.codes.badReq,
					message: "ID is not a valid Folderr ID",
				});
			}

			// Only finds a user who is an admin and isn't the owner
			const user = await core.db.setAdmin(request.params.id, false);
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
				`Administrator removed for ${user.username} (${user.id}) by ${auth.username} (${auth.id})`,
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
