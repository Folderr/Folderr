import type Core from "../../../Structures/core";
import type { FastifyInstance } from "fastify";

export const path = "/verifying-users";
export const enabled = false;

export function route(fastify: FastifyInstance, core: Core) {
	// @ts-expect-error I haven't finished this yet, shut it TS
	fastify.route({
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
				204: {
					type: "object",
					properties: {
						message: {
							type: "string",
						},
						code: { type: "number" },
					},
				},
				"4XX": {
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
				return reply.status(auth.code).send({
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
					"email createdAt username id"
				);
				console.log(users);

				if (users.length === 0) {
					return await reply.status(core.codes.noContent).send({
						code: core.Utils.foldCodes.dbNotFound,
						message: "No users found",
					});
				}

				return await reply.status(core.codes.ok).send({
					code: core.codes.ok,
					message: users,
				});
			} catch (error: unknown) {
				core.logger.error(error);
				return reply.status(core.codes.internalErr).send({
					code: core.Utils.foldCodes.dbUnkownError,
					message: error ?? "Unknown Error While Fetching Users",
				});
			}
		},
	});
}
