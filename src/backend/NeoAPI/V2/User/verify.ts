import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/verify/:userid/:token";
const method = "POST";

// How long a signup link stays valid before the pending account is removed
const EXPIRES_AFTER_MS = 48 * 60 * 60 * 1000;

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Confirms a signup with the link from the verification email, turning the pending signup into an account. Links expire after 48 hours",
			summary: "Verify own account",
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
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				"4xx": {
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

			if (Date.now() - verify.createdAt.getTime() >= EXPIRES_AFTER_MS) {
				await core.db.denySelf(verify.id);
				return reply.status(core.codes.notAccepted).send({
					code: core.Utils.foldCodes.userDenied,
					message: "Validation time expired.",
				});
			}

			await core.db.verifySelf(verify.id);
			core.logger.info(
				`User account ${verify.username} (${verify.id}) verified by self`,
			);
			const resp = await reply
				.status(core.codes.created)
				.send({ code: core.codes.ok, message: "OK" });
			if (core.emailer.active) {
				try {
					await core.emailer.welcomeEmail(
						verify.email,
						verify.username,
						core.config.url,
					);
				} catch (error: unknown) {
					core.logger.error(
						error,
						"Failed to send the welcome email",
					);
				}
			}

			return resp;
		},
	});
	fastify.log.info(`Initialized POST Verify Self at ${path}`);
}

// deny-self.ts rewrites the same path, so both legacy routes are replaced together
export default {
	// Self-verification only applies when signups are set to verify by email
	enabled: (core: Core) =>
		process.env.NODE_ENV === "dev" || core.config.signups === 2,
	method,
	path,
	rewrites: "/verify/:userid/:token",
	route,
} satisfies NeoRoute;
