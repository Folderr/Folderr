import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { Upload } from "../../../Structures/Database/db-class.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";
import {
	generateTimePage,
	PAGINATION_SCHEMA,
	type PageQuery,
} from "../../../Structures/Utilities/pagination.js";
import {
	routeType,
	uploadName,
} from "../../../Structures/Utilities/upload-types.js";

const path = "/files";
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Lists the signed-in user's uploads by upload time, newest first. Page with before and after (Unix milliseconds or an ISO date)",
			summary: "List uploads",
			security: [{ apiKey: [] }],
			querystring: PAGINATION_SCHEMA,
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
							type: "array",
							items: {
								type: "object",
								properties: {
									id: { type: "string" },
									type: { type: "string" },
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

			const images: Upload[] = await core.db.findFiles(
				page.filter,
				page.options,
			);
			if (images.length === 0) {
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
			const files = images.map((image: Upload) => ({
				id: image.id,
				type: routeType(image.contentType),
				createdAt: image.createdAt,
				link: `${url}/${routeType(image.contentType)[0]}/${uploadName(
					image.id,
					image.ext,
				)}`,
			}));
			return reply
				.status(core.codes.ok)
				.send({ code: core.codes.ok, message: files });
		},
	});
	fastify.log.info(`Initialized GET User Files at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	rewrites: "/files",
	route,
} satisfies NeoRoute;
