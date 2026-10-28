import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/verify";
const method = "DELETE";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["admin"],
			description: "Denies a pending signup and removes it",
			summary: "Deny account",
			security: [{ apiKey: [] }],
			body: {
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
				Body: {
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

			// Search for the user, and if not found send in an error
			const user = await core.db.findVerify({ id: request.body.id });
			if (!user) {
				return reply.status(core.codes.notFound).send({
					code: core.Utils.foldCodes.noUserFound,
					message: "User not found!",
				});
			}

			// Deny the account & delete notification
			await core.db.denyUser(user.id);
			core.logger.info(
				`User account denied by administrator (${user.username} - ${user.id})`,
			);
			return reply
				.status(core.codes.ok)
				.send({ code: core.codes.ok, message: "OK" });
		},
	});
	fastify.log.info(`Initialized DELETE Admin Deny Account at ${path}`);
}

// verify-account.ts rewrites the same path, so both legacy routes are replaced together
export default {
	enabled: true,
	method,
	path,
	rewrites: "/admin/verify",
	route,
} satisfies NeoRoute;
