import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/admin/:id";
const method = "POST";

type RouteTypes = { Params: { id: string } };

function route(fastify: FastifyInstance, core: Core) {
	fastify.route<RouteTypes>({
		method,
		url: path,
		schema: {
			tags: ["management"],
			description: "Makes a user an admin. Only the owner can do this",
			summary: "Promote to admin",
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
						{ code: 403, message: "Action forbidden" },
						{ code: 400, message: "ID is not a valid Folderr ID" },
						{
							code: 1054,
							message:
								'User not found, or the user was not found with role "admin"',
						},
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
		preHandler: fastify.policy.requireOwner,
		async handler(
			request: FastifyRequest<RouteTypes>,
			reply: FastifyReply,
		) {
			const auth = fastify.requestUser(request);
			if (!core.Utils.isValidFolderrId(request.params.id)) {
				return reply.status(request.server.codes.badReq).send({
					code: request.server.codes.badReq,
					message: "ID is not a valid Folderr ID",
				});
			}

			// Only finds a user who isn't already an admin and isn't the owner
			const user = await core.db.setAdmin(request.params.id, true);
			if (!user) {
				return reply.status(request.server.codes.notFound).send({
					message:
						'User not found, or the user was not found with role "user"',
					code: core.Utils.foldCodes.dbNotFound,
				});
			}

			// Eventually we'll make an audit log that goes here
			// So all admins can see what every user has done.
			core.logger.info(
				`Administrator privileges granted to ${user.username} (${user.id}) by ${auth.username} (${auth.id})`,
			);
			return reply
				.status(request.server.codes.ok)
				.send({ code: request.server.codes.ok, message: "OK" });
		},
	});
	fastify.log.info(`Initialized POST Management Add Admin at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
