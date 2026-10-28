import type { FastifyInstance } from "fastify";
import type Core from "../../../Structures/core.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/verifying-users";
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["admin"],
			description: "Show all the users that are awaiting verification",
			summary: "Retrieve verifying user (list)",
			security: [{ apiKey: [] }, { loginCookie: [] }],
			// How do you camelCase a number?
			response: {
				200: {
					examples: [
						{
							code: 200,
							message: [
								{
									id: "01JB8Z7D2F5H8K1M4P6R9T3VWX",
									username: "jamie",
									email: "jamie@example.com",
									createdAt: 1730073600000,
								},
							],
						},
						{ code: 1054, message: [] },
					],
					type: "object",
					properties: {
						message: {
							type: "array",
							items: {
								type: "object",
								properties: {
									email: { type: "string" },
									createdAt: { type: "number" },
									username: { type: "string" },
									id: { type: "string" },
								},
							},
						},
						code: { type: "number" },
					},
				},
				default: {
					examples: [
						{ code: 401, message: "Unauthorized" },
						{ code: 403, message: "Forbidden" },
						{
							code: 1053,
							message: "Unknown Error While Fetching Users",
						},
					],
					type: "object",
					properties: {
						message: {
							type: "string",
						},
						code: { type: "number" },
					},
				},
			},
		},
		async handler(request, reply) {
			// Honestly the user is not important.
			// We don't care at all, we just want them to be an admin
			const auth = await core.Utils.checkAuth(request, true);
			if (auth.code !== 200) {
				return reply.code(auth.code).send({
					code: auth.code,
					message:
						auth.code === core.codes.forbidden
							? "Forbidden"
							: "Unauthorized",
				});
			}

			try {
				const users = await core.db.findVerifies(
					{},
					"email createdAt username id",
				);

				if (users.length === 0) {
					return await reply.code(core.codes.ok).send({
						code: core.Utils.foldCodes.dbNotFound,
						message: [],
					});
				}

				return await reply.code(core.codes.ok).send({
					code: core.codes.ok,
					message: users,
				});
			} catch (error: unknown) {
				fastify.log.error(error);
				return reply.code(core.codes.internalErr).send({
					code: core.Utils.foldCodes.dbUnkownError,
					message: "Unknown Error While Fetching Users",
				});
			}
		},
	});
	fastify.log.info("Initializing GET Verifying Users");
}

export default {
	path,
	method,
	enabled: true,
	route,
} satisfies NeoRoute;
