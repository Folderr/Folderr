import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AccountReturn } from "../../../../types/user.js";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/account";
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Shows the signed-in user's account. A website login cookie holding an expired or invalid token is cleared",
			summary: "View account",
			security: [{ apiKey: [] }],
			response: {
				401: {
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
			},
		},
		async handler(request: FastifyRequest, reply: FastifyReply) {
			// Passing the reply lets a dead login cookie be cleared
			const auth = await core.Utils.checkAuth(
				request,
				false,
				false,
				reply,
			);
			if (auth.code !== 200) {
				return reply.status(auth.code).send({
					code: auth.code,
					message: "Authorization failed.",
				});
			}

			const { user } = auth;
			const acc: AccountReturn = {
				username: user.username,
				id: user.id,
				admin: user.admin ?? false,
				owner: user.owner ?? false,
				files: user.files,
				links: user.links,
				email: user.email,
				pendingEmail: user.pendingEmail,
				notifications: user.notifs,
				customUrls: user.cURLs,
				createdAt: user.createdAt.getTime(),
				privacy: user.privacy,
			};
			return reply
				.status(core.codes.ok)
				.send({ message: acc, code: core.codes.ok });
		},
	});
	fastify.log.info(`Initialized GET User Account at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
