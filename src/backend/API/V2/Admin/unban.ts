import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/ban";
const method = "DELETE";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["admin"],
			description: "Lifts the ban on an email, so it can sign up again",
			summary: "Unban",
			security: [{ apiKey: [] }],
			// TODO: Add reason if/when Folderr gets an audit log
			body: {
				type: "object",
				properties: {
					email: { type: "string" },
				},
				required: ["email"],
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
					email: string;
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

			if (!core.emailer.validateEmail(request.body.email)) {
				return reply.status(core.codes.badReq).send({
					code: core.codes.badReq,
					message: "Missing or invalid requirements",
				});
			}

			const unban = await core.db.removeBan(request.body.email);
			if (unban) {
				return reply
					.status(core.codes.ok)
					.send({ code: core.codes.ok, message: "OK" });
			}

			return reply.status(core.codes.notAccepted).send({
				code: core.codes.notAccepted,
				message: "UNBAN FAILED",
			});
		},
	});
	fastify.log.info(`Initialized DELETE Admin Unban at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
