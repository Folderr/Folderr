import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/warn/:id";
const method = "POST";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["admin"],
			description:
				"Warns a user. The warning shows in their notifications and, if the emailer is on, is emailed to them",
			summary: "Warn",
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
				return reply.status(auth.code).send({
					code: auth.code,
					message: "Authorization failed.",
				});
			}

			if (!core.Utils.isValidFolderrId(request.params.id)) {
				return reply.status(core.codes.badReq).send({
					code: core.codes.badReq,
					message: "Requirements missing or invalid!",
				});
			}

			const user = await core.db.findUser({ id: request.params.id });
			if (!user) {
				return reply.status(core.codes.notFound).send({
					code: core.Utils.foldCodes.dbNotFound,
					message: "User not found!",
				});
			}

			const id = core.Utils.genNotifyID();
			const updated = await core.db.updateUser(
				{ id: request.params.id },
				{
					$addToSet: {
						notifs: {
							id,
							title: "Warn",
							notify: `You were warned for: ${request.body.reason}`,
						},
					},
				},
			);
			if (!updated) {
				return reply.status(core.codes.notAccepted).send({
					code: core.Utils.foldCodes.unkownError,
					message: "Warn failed",
				});
			}

			if (core.emailer.active) {
				const url = await core.Utils.determineHomeURL(request);
				await core.emailer.warnEmail(
					user.email,
					request.body.reason,
					user.username,
					url,
				);
			}

			return reply.status(core.codes.ok).send({
				code: core.codes.ok,
				message: "OK",
			});
		},
	});
	fastify.log.info(`Initialized POST Admin Warn User at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	rewrites: "/admin/warn/:id",
	route,
} satisfies NeoRoute;
