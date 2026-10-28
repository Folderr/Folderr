import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../internals.js";
import type { NeoRoute } from "../Structures/neo-route.js";

const path = ["/link/:id", "/l/:id"];
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	const handler = async (
		request: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) => {
		const short = await core.db.findLink(
			{ id: request.params.id },
			"link owner",
		);
		if (!short) {
			return reply.status(core.codes.notFound).send("404 Not Found");
		}

		const owner = await core.db.findUser({ id: short.owner });
		if (!owner) {
			core.addDeleter(short.owner);
			return reply.status(core.codes.notFound).send("404 Not Found");
		}

		return reply.redirect(short.link.trim());
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

	fastify.log.info(`Initialized GET Short Links at ${path.join(", ")}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
