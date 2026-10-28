import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../internals.js";
import type { NeoRoute } from "../Structures/neo-route.js";
import {
	parseUploadName,
	sendUpload,
} from "../Structures/Utilities/upload-types.js";

// The /f, /i and /v prefixes all serve any upload; links use the one that suits
// the file's type, but it's only cosmetic
const path = [
	"/file/:id",
	"/f/:id",
	"/image/:id",
	"/i/:id",
	"/videos/:id",
	"/v/:id",
];
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	const handler = async (
		request: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) => {
		// The link names the file as <id>.<ext>, or just <id> when it has no extension
		const { id, ext } = parseUploadName(request.params.id);
		const upload = await core.db.findFile(
			{ id, ext },
			"id ext owner contentType",
		);
		if (!upload) {
			return reply.status(core.codes.notFound).send("404 Not Found");
		}

		const owner = await core.db.findUser({ id: upload.owner });
		if (!owner) {
			core.addDeleter(upload.owner);
			return reply.status(core.codes.notFound).send("404 Not Found");
		}

		return sendUpload(reply, upload);
	};

	for (const url of path) {
		fastify.route({
			method,
			url,
			schema: {
				hide: true, // A page, not part of the API docs
				params: {
					type: "object",
					properties: { id: { type: "string" } },
					required: ["id"],
				},
				response: { "4xx": { type: "string" } },
			},
			handler,
		});
	}

	fastify.log.info(`Initialized GET Files at ${path.join(", ")}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
