import { FastifyInstance, FastifyRequest } from "fastify";
import { Core } from "../../../internals";

export const path = "/notification/:id";

export const enabled = true;

export const rewrites = "/notification/:id";
export const method = "GET";

export async function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			/* eslint-disable @typescript-eslint/naming-convention */
			params: {
				type: "object",
				properties: {
					id: { type: "string" },
				},
				required: ["id"],
			},
			response: {
				/* eslint-disable @typescript-eslint/naming-convention */
				"4xx": {
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				"2xx": {
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
				Params: {
					id: string;
				};
			}>,
			reply,
		) {
			const auth = await core.Utils.checkAuth(request, true);
			if (!auth) {
				return reply.status(this.codes.unauth).send({
					code: this.codes.unauth,
					message: "Authorization failed.",
				});
			}

			// Verify query
			if (!request.params.id) {
				return reply.status(this.codes.badReq).send({
					code: this.codes.badReq,
					message: "Notification ID required!",
				});
			}

			// Find notification. If not found, return a not found status code
			const notify = await core.db.findAdminNotify({
				id: request.params.id,
			});
			if (!notify) {
				return reply.status(this.codes.noContent).send({
					code: core.Utils.foldCodes.dbNotFound,
					message: [],
				});
			}

			// Oh look a notification!
			return reply
				.status(this.codes.ok)
				.send({ code: this.codes.ok, message: notify });
		},
	});
	fastify.log.info(
		undefined,
		`Initialized GET Admin Notifications at ${path}`,
	);
}
