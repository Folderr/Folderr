import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { User } from "../../../Structures/Database/db-class.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";
import {
	generateTimePage,
	PAGINATION_SCHEMA,
	type PageQuery,
} from "../../../Structures/Utilities/pagination.js";

const path = "/users";
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["admin"],
			description:
				"Lists accounts by creation time, newest first. Page with before and after (Unix milliseconds or an ISO date)",
			summary: "List users",
			security: [{ apiKey: [] }, { loginCookie: [] }],
			querystring: PAGINATION_SCHEMA,
			response: {
				"4xx": {
					examples: [
						{ code: 401, message: "Authorization failed." },
						{
							code: 400,
							message:
								"Request poorly formed, the querystring is invalid",
						},
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				500: {
					examples: [
						{ code: 500, message: "An internal error occurred" },
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				200: {
					examples: [
						{
							code: 200,
							message: [
								{
									title: "admin",
									username: "aervy",
									email: "aervy@example.com",
									files: 120,
									links: 14,
									id: "01JB8Z6Q3K4M9T2V7XWYH5N0RC",
									createdAt: 1730073600000,
								},
								{
									title: "user",
									username: "jamie",
									email: "jamie@example.com",
									files: 3,
									links: 0,
									id: "01JB8Z7D2F5H8K1M4P6R9T3VWX",
									createdAt: 1729987200000,
								},
							],
						},
						{ code: 1054, message: [] },
					],
					type: "object",
					properties: {
						message: {
							type: "array",
							items: {
								type: "object",
								properties: {
									title: { type: "string" }, // Maybe change to `role` later
									username: { type: "string" },
									email: { type: "string" },
									files: { type: "number" }, // Statistic / Count
									links: { type: "number" }, // Stat / Count
									id: { type: "string" }, // ULID
									createdAt: { type: "number" },
								},
							},
						},
						code: { type: "number" },
					},
				},
			},
		},
		async handler(
			request: FastifyRequest<{
				Querystring: PageQuery;
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

			const page = generateTimePage(
				{
					before: request.query.before,
					after: request.query.after,
					limit: request.query.limit,
				},
				undefined,
				request.query.ascending,
			);
			if (!page) {
				return reply.status(core.codes.badReq).send({
					code: core.codes.badReq,
					message:
						"Request poorly formed, the querystring is invalid",
				});
			}

			const users: User[] = await core.db.findUsers(
				page.filter,
				page.options,
			);
			// An empty page is normal when paging past the oldest account
			if (users.length === 0) {
				return reply.status(core.codes.ok).send({
					code: core.Utils.foldCodes.dbNotFound,
					message: [],
				});
			}

			const array: Array<{
				title: string;
				username: string;
				email: string;
				files: number;
				links: number;
				id: string;
				createdAt: Date; // Fastify will convert this
			}> = users.map((user: User) => ({
				title: user.owner ? "owner" : user.admin ? "admin" : "user",
				username: user.username,
				email: user.email,
				files: user.files,
				links: user.links,
				id: user.id,
				createdAt: user.createdAt,
			}));
			return reply
				.status(core.codes.ok)
				.send({ code: core.codes.ok, message: array });
		},
	});
	fastify.log.info(`Initialized GET Admin Users at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
