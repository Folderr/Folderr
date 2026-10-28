import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/verify";
const method = "POST";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["admin"],
			description:
				"Accepts a pending signup and turns it into an account",
			summary: "Verify account",
			security: [{ apiKey: [] }, { loginCookie: [] }],
			body: {
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
						{
							code: 400,
							message: "body must have required property 'id'",
						},
						{ code: 1008, message: "User not found!" },
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				201: {
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

			// Look for the user
			const user = await core.db.findVerify({ id: request.body.id });
			if (!user) {
				return reply.status(core.codes.notFound).send({
					code: core.Utils.foldCodes.noUserFound,
					message: "User not found!",
				});
			}

			// Remove the user from verifying schema and add them to the actual user base
			await core.db.verifyUser(user.id);
			core.logger.info(
				`User account ${user.username} (${user.id}) granted by administrator ${auth.user.username} (${auth.user.id})`,
			);
			return reply
				.status(core.codes.created)
				.send({ code: core.codes.ok, message: "OK" });
		},
	});
	fastify.log.info(`Initialized POST Admin Verify Account at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
