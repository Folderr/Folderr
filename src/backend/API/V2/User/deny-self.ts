import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/verify/:userid/:token";
const method = "DELETE";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Cancels a signup with the link from the verification email, removing the pending signup",
			summary: "Deny own account",
			params: {
				type: "object",
				properties: {
					userid: { type: "string" },
					token: { type: "string" },
				},
				required: ["userid", "token"],
			},
			response: {
				"2xx": {
					examples: [{ code: 200, message: "OK" }],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				"4xx": {
					examples: [
						{
							code: 400,
							message: "Malformed or otherwise invalid ID",
						},
						{ code: 1054, message: "User not found!" },
					],
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
				Params: {
					userid: string;
					token: string;
				};
			}>,
			reply: FastifyReply,
		) {
			if (!core.Utils.isValidFolderrId(request.params.userid)) {
				return reply.status(core.codes.badReq).send({
					code: core.codes.badReq,
					message: "Malformed or otherwise invalid ID",
				});
			}

			const verify = await core.Utils.findVerifying(
				request.params.token,
				request.params.userid,
			);
			if (!verify) {
				return reply.status(core.codes.notFound).send({
					code: core.Utils.foldCodes.dbNotFound,
					message: "User not found!",
				});
			}

			await core.db.denySelf(verify.id);
			core.logger.info(
				`Signup for ${verify.username} (${verify.id}) cancelled by self`,
			);
			return reply
				.status(core.codes.ok)
				.send({ code: core.codes.ok, message: "OK" });
		},
	});
	fastify.log.info(`Initialized DELETE Deny Self at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
