import type { FastifyInstance } from "fastify";
import type { Core } from "../../../../internals.js";

export const type = "GET";
export const label = "Health Check";
export const url = "/health";
export default (fastify: FastifyInstance, _core: Core) =>
	fastify.route({
		method: "GET",
		schema: {
			response: {
				"2xx": {
					type: "object",
					properties: {
						code: { type: "number" },
						message: { type: "string" },
					},
				},
			},
		},
		url,
		handler(_request, reply) {
			if (fastify.db.status !== "ok") {
				return reply.send({
					code: fastify.utils.foldCodes.dbError,
					message: "DB Down",
				});
			}

			return reply.send({ code: fastify.codes.ok, message: "OK" });
		},
	});
