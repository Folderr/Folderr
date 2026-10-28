import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { Notification } from "../../../Structures/Database/db-class.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/notifications";
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Lists the signed-in user's notifications. Admins can pass admin=true to list admin notifications instead",
			summary: "List notifications",
			security: [{ apiKey: [] }, { loginCookie: [] }],
			querystring: {
				type: "object",
				properties: {
					admin: { type: "boolean" },
				},
			},
			response: {
				"4xx": {
					examples: [
						{ code: 401, message: "Authorization failed." },
						{ code: 403, message: "Forbidden" },
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
									id: "01JB8Z6Q3K4M9T2V7XWYH5N0RC",
									title: "Account warned",
									notify: "Please keep uploads within the terms of service.",
									createdAt: 1730073600000,
								},
								{
									id: "01JB7XKD2R8F4N6P1QZ3W9M5TA",
									title: "New user signup!",
									notify: "Username: jamie,User ID: 01J9W4E7T5H2C8B3N6M1QK0DXF,Validation Token: abc123",
									createdAt: 1729987200000,
								},
							],
						},
					],
					type: "object",
					properties: {
						message: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: { type: "string" },
									title: { type: "string" },
									notify: { type: "string" },
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
				Querystring: {
					admin?: boolean;
				};
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

			let notifs: Notification[] = auth.user.notifs ?? [];
			// If the user wants to view admin notifications
			if (request.query?.admin === true) {
				if (!auth.user.admin && !auth.user.owner) {
					return reply.status(core.codes.forbidden).send({
						code: core.codes.forbidden,
						message: "Forbidden",
					});
				}

				const anotifs = await core.db.findAdminNotifies({});
				notifs = anotifs.map((notification: Notification) => ({
					id: notification.id,
					title: notification.title,
					notify: notification.notify.replace(/\n/g, ","),
					createdAt: notification.createdAt,
				}));
			}

			return reply
				.status(core.codes.ok)
				.send({ code: core.codes.ok, message: notifs });
		},
	});
	fastify.log.info(`Initialized GET User Notifications at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
