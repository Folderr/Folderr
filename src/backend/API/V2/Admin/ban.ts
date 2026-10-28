import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals";
import type { NeoRoute } from "../../../Structures/neo-route";

const path = "/ban/:id";
const method = "POST";

async function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["admin"],
			description: "Bans a user (via email) from the service",
			summary: "Ban",
			security: [{ apiKey: [] }],
			body: {
				type: "object",
				properties: {
					reason: { type: "string" },
				},
				required: ["reason"],
			},
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
				"2xx": {
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
					reason: string;
				};
				Params: {
					id: string;
				};
			}>,
			reply: FastifyReply,
		) {
			const auth = await core.Utils.checkAuth(request, true);
			if (auth.code !== 200) {
				return reply.status(core.codes.unauth).send({
					code: core.codes.unauth,
					message: "Authorization failed.",
				});
			}

			if (!core.Utils.isValidFolderrId(request.params.id)) {
				return reply.status(core.codes.badReq).send({
					code: core.codes.badReq,
					message: "Missing requirements",
				});
			}

			const user = await core.db.findUser({ id: request.params.id });
			if (!user) {
				return reply.status(core.codes.notFound).send({
					code: core.Utils.foldCodes.dbNotFound,
					message: "User not found!",
				});
			}

			const ban = await core.db.addBan(
				user.email,
				user.id,
				request.body.reason,
			);
			if (ban) {
				if (core.emailer.active) {
					const url = await core.Utils.determineHomeURL(request);
					await core.emailer.banEmail(
						user.email,
						request.body.reason,
						user.username,
						url,
					);
				}

				core.addDeleter(user.id);
				await core.db.markUserForDeletion(user.id);
				return reply.status(core.codes.ok).send({
					code: core.codes.ok,
					message: "OK",
				});
			}

			return reply.status(core.codes.notAccepted).send({
				code: core.codes.notAccepted,
				message: "BAN FAILED",
			});
		},
	});
	fastify.log.info(`Initialized POST Admin Ban at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
