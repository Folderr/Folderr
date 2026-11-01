import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { Link } from "../../../Structures/Database/db-class.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";
import {
	generateTimePage,
	PAGINATION_SCHEMA,
	type PageQuery,
} from "../../../Structures/Utilities/pagination.js";

const path = "/links";
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Lists the signed-in user's short links by creation time, newest first. Page with before and after (Unix milliseconds or an ISO date)",
			summary: "List links",
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
				200: {
					examples: [
						{
							code: 200,
							message: [
								{
									id: "aB3xK9q",
									points_to:
										"https://example.com/some/long/article",
									createdAt: 1730073600000,
									link: "https://folderr.example.com/aB3xK9q",
								},
								{
									id: "Zt7mP2",
									points_to: "https://docs.example.org/guide",
									createdAt: 1729987200000,
									link: "https://folderr.example.com/Zt7mP2",
								},
							],
						},
						{ code: 200, message: [] },
					],
					type: "object",
					properties: {
						message: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: { type: "string" },
									points_to: { type: "string" },
									createdAt: { type: "number" }, // Fastify converts the Date to milliseconds
									link: { type: "string" },
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
			const auth = await core.Utils.checkAuth(request);
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
				auth.user.id,
				request.query.ascending,
			);
			if (!page) {
				return reply.status(core.codes.badReq).send({
					code: core.codes.badReq,
					message:
						"Request poorly formed, the querystring is invalid",
				});
			}

			const shorts: Link[] = await core.db.findLinks(
				page.filter,
				page.options,
			);
			if (shorts.length === 0) {
				return reply
					.status(core.codes.ok)
					.send({ code: core.codes.ok, message: [] });
			}

			const responseURL = request.headers.responseurl;
			let url =
				typeof responseURL === "string" &&
				auth.user.cURLs.includes(responseURL) &&
				(await core.Utils.testMirrorURL(responseURL))
					? responseURL
					: await core.Utils.determineHomeURL(request);
			url = url.replace(/\/$/g, "");
			const aShorts = shorts.map((short: Link) => ({
				id: short.id,
				points_to: short.link,
				createdAt: short.createdAt,
				link: `${url}/${short.id}`,
			}));
			return reply
				.status(core.codes.ok)
				.send({ code: core.codes.ok, message: aShorts });
		},
	});
	fastify.log.info(`Initialized GET User Links at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
