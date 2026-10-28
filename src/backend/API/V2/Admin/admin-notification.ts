import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Core } from "../../../internals";
import type { NeoRoute } from "../../../Structures/neo-route";

const path = "/notification/:id";
const method = "GET";

async function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["admin"],
			description: "Retrieve the notifications for administrators",
			summary: "Admin notifications",
			security: [{ apiKey: [] }, { loginCookie: [] }],
			params: {
				type: "object",
				properties: {
					id: { type: "string" },
				},
				required: ["id"],
			},
			response: {
				"4xx": {
					examples: [{ code: 401, message: "Authorization failed." }],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				"2xx": {
					examples: [
						{
							code: 200,
							message: {
								id: "01JB8Z6Q3K4M9T2V7XWYH5N0RC",
								title: "New user signup!",
								notify: "Username: jamie\nUser ID: 01JB8Z7D2F5H8K1M4P6R9T3VWX",
								createdAt: 1730073600000,
							},
						},
					],
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
			if (auth.code === 200) {
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

export default {
	enabled: true,
	path,
	method,
	route,
} satisfies NeoRoute;
