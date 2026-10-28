import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { User } from "../../../Structures/Database/db-class.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/authorize";
const method = "POST";

// How long the website login lasts
const SESSION_DAYS = 14;

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Signs in to the website with the username and password headers, and sets the login cookie",
			summary: "Sign in",
			headers: {
				type: "object",
				properties: {
					username: { type: "string" },
					password: { type: "string" },
				},
				required: ["username", "password"],
			},
			response: {
				"4xx": {
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				500: {
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
		async handler(request: FastifyRequest, reply: FastifyReply) {
			let auth: false | User = false;
			try {
				auth = await core.Utils.authPassword(request);
			} catch (error: unknown) {
				core.logger.error(error);
			}

			if (!auth) {
				return reply.status(core.codes.unauth).send({
					code: core.codes.unauth,
					message: "Authorization failed.",
				});
			}

			try {
				const jwt = await core.Utils.authorization.genKeyWeb(auth.id);
				const expires = new Date();
				expires.setDate(expires.getDate() + SESSION_DAYS);
				return await reply
					.cookie("token", jwt, {
						...core.Utils.tokenCookieOptions(request),
						expires,
					})
					.status(core.codes.ok)
					.send({
						code: core.codes.ok,
						message: "OK",
					});
			} catch (error: unknown) {
				core.logger.error(error);
				return reply.status(core.codes.internalErr).send({
					code: core.codes.internalErr,
					message: "failed to generate auth code",
				});
			}
		},
	});
	fastify.log.info(`Initialized POST Sign In at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	rewrites: "/authorize",
	route,
} satisfies NeoRoute;
