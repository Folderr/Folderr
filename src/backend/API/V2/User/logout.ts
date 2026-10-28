import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/logout";
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Signs out of the website. With everywhere=true, ends every website login for the account",
			summary: "Sign out",
			querystring: {
				type: "object",
				properties: { everywhere: { type: "boolean" } },
			},
		},
		async handler(
			request: FastifyRequest<{
				Querystring: {
					everywhere?: boolean;
				};
			}>,
			reply: FastifyReply,
		) {
			if (request.query.everywhere) {
				const auth = await core.Utils.checkAuth(
					request,
					false,
					false,
					reply,
				);
				if (auth.code !== 200) {
					return reply
						.status(auth.code)
						.send({ message: "Unauthorized", code: auth.code });
				}

				const revoked = await core.Utils.authorization.revokeAll(
					auth.user.id,
					true,
				);
				if (!revoked) {
					return reply.status(core.codes.internalErr).send({
						message: "Could not logout",
						code: core.codes.internalErr,
					});
				}

				if (request.cookies.token) {
					reply.clearCookie(
						"token",
						core.Utils.tokenCookieOptions(request),
					);
				}

				return reply
					.status(core.codes.ok)
					.send({ message: "Logged out", code: core.codes.ok });
			}

			if (!request.cookies.token) {
				return reply.redirect("/");
			}

			let revoked = false;
			try {
				revoked = Boolean(
					await core.Utils.authorization.revoke(
						request.cookies.token,
						true,
					),
				);
			} catch (error: unknown) {
				// An invalid or expired token is already as good as logged out
				if (
					!(
						error instanceof Error &&
						error.message === "Invalid Token"
					)
				) {
					throw error;
				}

				revoked = true;
			}

			if (!revoked) {
				return reply.status(core.codes.internalErr).send({
					message: "Could not logout",
					code: core.codes.internalErr,
				});
			}

			return reply
				.clearCookie("token", core.Utils.tokenCookieOptions(request))
				.status(core.codes.ok)
				.send({ message: "Logged out", code: core.codes.ok });
		},
	});
	fastify.log.info(`Initialized GET Sign Out at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
