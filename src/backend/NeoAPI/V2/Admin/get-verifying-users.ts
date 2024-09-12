import type Core from "../../../Structures/core.js";
import type { FastifyInstance } from "fastify";

export const path = "/verifying-users";
export const enabled = true;
export const method = "GET";

export function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			/* eslint-disable @typescript-eslint/naming-convention */
			// How do you camelCase a number?
			response: {
				200: {
					type: "object",
					properties: {
						message: {
							type: "array",
						},
						code: { type: "number" },
					},
				},
				default: {
					type: "object",
					properties: {
						message: {
							type: "string",
						},
						code: { type: "number" },
					},
				},
			},
			/* eslint-enable @typescript-eslint/naming-convention */
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
					message: error ?? "Unknown Error While Fetching Users",
				});
			}
		},
	});
	fastify.log.info("Initializing GET Verifying Users");
}
