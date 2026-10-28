import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/content/:type/:id/account";
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["admin"],
			description: "Shows which account owns a file or a link",
			summary: "Look up content owner",
			security: [{ apiKey: [] }],
			params: {
				type: "object",
				properties: {
					type: { type: "string" },
					id: { type: "string" },
				},
				required: ["id", "type"],
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
						message: {
							type: "object",
							properties: {
								id: { type: "string" },
								username: { type: "string" },
								createdAt: { type: "number" },
							},
						},
						code: { type: "number" },
					},
				},
			},
		},
		async handler(
			request: FastifyRequest<{
				Params: {
					id: string;
					type: "file" | "link";
				};
			}>,
			reply: FastifyReply,
		) {
			const auth = await core.Utils.checkAuth(request, true);
			if (auth.code !== 200) {
				return reply.status(auth.code).send({
					code: auth.code,
					message:
						auth.code === 401
							? "Authorization failed"
							: "Forbidden",
				});
			}

			if (
				!["file", "link"].includes(request.params.type) ||
				!/^[\dA-Za-z]+$/.test(request.params.id)
			) {
				return reply.status(core.codes.badReq).send({
					code: core.codes.badReq,
					message: "Missing or invalid requirements",
				});
			}

			const out =
				request.params.type === "file"
					? await core.db.findFile({ id: request.params.id })
					: await core.db.findLink({ id: request.params.id });
			if (!out) {
				return reply.status(core.codes.notFound).send({
					code: core.Utils.foldCodes.dbNotFound,
					message: `${request.params.type === "file" ? "File" : "Link"} not found!`,
				});
			}

			const user = await core.db.findUser(
				{ id: out.owner },
				"id username createdAt",
			);
			if (!user) {
				return reply.status(core.codes.notFound).send({
					code: core.Utils.foldCodes.noUserFound,
					message: "Owner not found!",
				});
			}

			return reply.status(core.codes.ok).send({
				code: core.codes.ok,
				message: {
					id: user.id,
					username: user.username,
					createdAt: user.createdAt.getTime(),
				},
			});
		},
	});
	fastify.log.info(`Initialized GET Admin Reverse Account Lookup at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	rewrites: "/admin/content/:type/:id/account",
	route,
} satisfies NeoRoute;
