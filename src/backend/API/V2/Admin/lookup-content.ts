import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/content/:type/:id";
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["admin"],
			description:
				"Shows a file's or a link's record. Files include their content type and extension, links include where they point",
			summary: "Look up content",
			security: [{ apiKey: [] }, { loginCookie: [] }],
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
					examples: [
						{ code: 401, message: "Authorization failed" },
						{ code: 403, message: "Forbidden" },
						{
							code: 400,
							message: "Missing or invalid requirements",
						},
						{ code: 1054, message: "File not found!" },
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				500: {
					examples: [
						{
							code: 1019,
							message:
								"Unknown error while looking up the content",
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
							message: {
								id: "abc123",
								owner: "01JB8Z7D2F5H8K1M4P6R9T3VWX",
								createdAt: 1730073600000,
								contentType: "image/png",
								ext: "png",
							},
						},
						{
							code: 200,
							message: {
								id: "xyz789",
								owner: "01JB8Z7D2F5H8K1M4P6R9T3VWX",
								createdAt: 1730160000000,
								link: "https://example.com/some/long/page",
							},
						},
					],
					type: "object",
					properties: {
						message: {
							type: "object",
							properties: {
								id: { type: "string" },
								owner: { type: "string" },
								createdAt: { type: "number" },
								// Files only
								contentType: { type: "string" },
								ext: { type: "string" },
								// Links only
								link: { type: "string" },
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
				!/^[A-Za-z\d]+$/.test(request.params.id)
			) {
				return reply.status(core.codes.badReq).send({
					code: core.codes.badReq,
					message: "Missing or invalid requirements",
				});
			}

			try {
				const out =
					request.params.type === "file"
						? await core.db.findFile({ id: request.params.id })
						: await core.db.findLink({ id: request.params.id });
				if (!out) {
					return await reply.status(core.codes.notFound).send({
						code: core.Utils.foldCodes.dbNotFound,
						message: `${request.params.type === "file" ? "File" : "Link"} not found!`,
					});
				}

				return await reply
					.status(core.codes.ok)
					.send({ code: core.codes.ok, message: out });
			} catch (error: unknown) {
				fastify.log.error(error);
				return reply.status(core.codes.internalErr).send({
					code: core.Utils.foldCodes.dbError,
					message: "Unknown error while looking up the content",
				});
			}
		},
	});
	fastify.log.info(`Initialized GET Admin Lookup Content at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
