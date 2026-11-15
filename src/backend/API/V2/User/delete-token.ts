import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/account/token/:id";
const method = "DELETE";

type RouteTypes = {
	Querystring: {
		web?: boolean;
	};
	Params: {
		id: string;
	};
};

function route(fastify: FastifyInstance, core: Core) {
	fastify.route<RouteTypes>({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Revokes one of the signed-in user's API tokens, or a login session with web=true. Needs the website login or a username and password; API tokens can't use this",
			summary: "Revoke API token",
			security: [{ loginCookie: [] }, { username: [], password: [] }],
			params: {
				type: "object",
				properties: {
					id: { type: "string" },
				},
				required: ["id"],
			},
			querystring: {
				type: "object",
				properties: {
					web: { type: "boolean" },
				},
			},
			response: {
				"4xx": {
					examples: [
						{ code: 401, message: "Authorization failed." },
						{ code: 400, message: "Missing or invalid token ID!" },
						{ code: 1054, message: "Token not deleted/found!" },
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				200: {
					examples: [{ code: 200, message: "OK" }],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
			},
		},
		preHandler: fastify.requireSessionOrPassword,
		async handler(
			request: FastifyRequest<RouteTypes>,
			reply: FastifyReply,
		) {
			const auth = fastify.requestUser(request);

			if (/^\d+$/.test(request.params.id)) {
				return reply.status(core.codes.badReq).send({
					code: core.codes.badReq,
					message: "Missing or invalid token ID!",
				});
			}

			const del = await core.db.purgeToken(request.params.id, auth.id, {
				web: request.query?.web === true,
			});
			if (!del) {
				return reply.status(core.codes.notFound).send({
					code: core.Utils.foldCodes.dbNotFound,
					message: "Token not deleted/found!",
				});
			}

			return reply.status(core.codes.ok).send({
				code: core.codes.ok,
				message: "OK",
			});
		},
	});
	fastify.log.info(`Initialized DELETE User Token at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
