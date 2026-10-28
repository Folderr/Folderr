import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/account";
const method = "DELETE";

/**
 * @desc Deletes an account and everything it owns. Returns false if the database failed.
 */
async function deleteAccount(core: Core, id: string): Promise<boolean> {
	try {
		await core.db.purgeUser(id);
		return true;
	} catch (error: unknown) {
		core.logger.error(error, "[SYSTEM ERROR] - Account deletion failure");
		return false;
	}
}

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Deletes the signed-in user's account. Admins can delete someone else's with ?userid= and a reason; nobody can delete the owner",
			summary: "Delete account",
			security: [{ apiKey: [] }],
			querystring: {
				type: "object",
				properties: {
					userid: { type: "string" },
				},
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
		async handler(
			request: FastifyRequest<{
				Querystring: {
					userid?: string;
				};
				Body?: {
					reason?: string;
				};
			}>,
			reply: FastifyReply,
		) {
			// Deleting someone else's account needs an admin
			const needAdmin = typeof request.query.userid === "string";
			const auth = await core.Utils.checkAuth(request, needAdmin);
			if (auth.code !== 200) {
				return reply.status(auth.code).send({
					code: auth.code,
					message: "Authorization failed.",
				});
			}

			const failed = {
				code: core.codes.internalErr,
				message: "Account deletion failed",
			};

			if (needAdmin) {
				if (!request.body?.reason) {
					return reply.status(core.codes.badReq).send({
						code: core.codes.badReq,
						message: "Missing reason for account deletion",
					});
				}

				const mem = await core.db.findUser({
					id: request.query.userid,
				});
				if (!mem) {
					return reply.status(core.codes.notFound).send({
						code: core.Utils.foldCodes.dbNotFound,
						message: "User not found!",
					});
				}

				// Protect the owner and admins from unauthorized account deletions
				if (mem.owner) {
					return reply.status(core.codes.forbidden).send({
						code: core.codes.forbidden,
						message:
							"You can not delete that account as they are the owner!",
					});
				}

				if (mem.admin && !auth.user.owner) {
					return reply.status(core.codes.forbidden).send({
						code: core.codes.forbidden,
						message: "You cannot delete another admins account!",
					});
				}

				if (!(await deleteAccount(core, mem.id))) {
					return reply.status(core.codes.internalErr).send(failed);
				}

				core.logger.info(
					`Account ${mem.id} deleted by administrator (${auth.user.username} - ${auth.user.id}). Reason: ${request.body.reason}`,
				);
				return reply
					.status(core.codes.ok)
					.send({ code: core.codes.ok, message: "Account deleted!" });
			}

			// The owner account may never be deleted
			if (auth.user.owner) {
				return reply.status(core.codes.forbidden).send({
					message:
						"You can not delete your account as you are the owner!",
					code: core.codes.forbidden,
				});
			}

			if (!(await deleteAccount(core, auth.user.id))) {
				return reply.status(core.codes.internalErr).send(failed);
			}

			core.logger.info(`Account ${auth.user.id} deleted`);
			// The account's gone, so its login cookie is useless now
			if (request.cookies.token) {
				reply.clearCookie(
					"token",
					core.Utils.tokenCookieOptions(request),
				);
			}

			return reply
				.status(core.codes.ok)
				.send({ code: core.codes.ok, message: "Account deleted!" });
		},
	});
	fastify.log.info(`Initialized DELETE User Account at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
