import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AccountReturn } from "../../../../types/user.js";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/account";
const method = "GET";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Shows the signed-in user's account. A website login cookie holding an expired or invalid token is cleared",
			summary: "View account",
			security: [{ apiKey: [] }, { loginCookie: [] }],
			response: {
				"4xx": {
					examples: [{ code: 401, message: "Authorization failed." }],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				200: {
					examples: [
						{
							message: {
								username: "aervy",
								id: "01JB8Z6Q3K4M9T2V7XWYH5N0RC",
								admin: false,
								owner: false,
								files: 42,
								links: 7,
								email: "aervy@example.com",
								notifications: [
									{
										id: "01JBA2C7RZ5V8N3Q6M1KXT4WDE",
										title: "Welcome",
										notify: "Welcome to Folderr!",
										createdAt: 1730073600000,
									},
								],
								customUrls: ["https://mirror.example.com"],
								createdAt: 1730073600000,
								privacy: { dataCollection: false },
							},
							code: 200,
						},
					],
					type: "object",
					properties: {
						message: {
							type: "object",
							properties: {
								username: { type: "string" },
								id: { type: "string" },
								admin: { type: "boolean" },
								owner: { type: "boolean" },
								files: { type: "number" },
								links: { type: "number" },
								email: { type: "string" },
								// Set while an email change waits for confirmation
								pendingEmail: { type: "string" },
								notifications: {
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
								customUrls: {
									type: "array",
									items: { type: "string" },
								},
								createdAt: { type: "number" },
								privacy: {
									type: "object",
									properties: {
										dataCollection: { type: "boolean" },
									},
								},
							},
						},
						code: { type: "number" },
					},
				},
			},
		},
		async handler(request: FastifyRequest, reply: FastifyReply) {
			// Passing the reply lets a dead login cookie be cleared
			const auth = await core.Utils.checkAuth(
				request,
				false,
				false,
				reply,
			);
			if (auth.code !== 200) {
				return reply.status(auth.code).send({
					code: auth.code,
					message: "Authorization failed.",
				});
			}

			const { user } = auth;
			const acc: AccountReturn = {
				username: user.username,
				id: user.id,
				admin: user.admin ?? false,
				owner: user.owner ?? false,
				files: user.files,
				links: user.links,
				email: user.email,
				pendingEmail: user.pendingEmail,
				notifications: user.notifs,
				customUrls: user.cURLs,
				createdAt: user.createdAt.getTime(),
				privacy: user.privacy,
			};
			return reply
				.status(core.codes.ok)
				.send({ message: acc, code: core.codes.ok });
		},
	});
	fastify.log.info(`Initialized GET User Account at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
