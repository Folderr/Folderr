import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/notification/:id";
const method = "DELETE";

// How long a warning has to stay before the user can delete it
const WARN_LOCK_MS = 90 * 24 * 60 * 60 * 1000;

const DURATION_UNITS: Array<[string, number]> = [
	["Days", 24 * 60 * 60 * 1000],
	["Hours", 60 * 60 * 1000],
	["Minutes", 60 * 1000],
	["Seconds", 1000],
];

/**
 * @desc Formats a length of time as e.g. "89 Days, 23 Hours, 5 Minutes".
 */
function formatDuration(ms: number): string {
	const parts: string[] = [];
	for (const [name, size] of DURATION_UNITS) {
		const amount = Math.floor(ms / size);
		ms -= amount * size;
		if (amount > 0) {
			parts.push(`${amount} ${name}`);
		}
	}

	return parts.join(", ") || "0 Seconds";
}

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Deletes one of the signed-in user's notifications. Warnings can't be deleted for 90 days",
			summary: "Delete notification",
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
					examples: [
						{ code: 401, message: "Authorization failed." },
						{ code: 1054, message: "Notification not found!" },
						{
							code: 403,
							message:
								"Notification cannot be deleted for 89 Days, 23 Hours, 5 Minutes",
						},
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				500: {
					examples: [
						{ code: 500, message: "An internal error occurred" },
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				200: {
					examples: [{ code: 200, message: "OK" }],
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
			reply: FastifyReply,
		) {
			const auth = await core.Utils.checkAuth(request);
			if (auth.code !== 200) {
				return reply.status(auth.code).send({
					code: auth.code,
					message: "Authorization failed.",
				});
			}

			const notify = auth.user.notifs?.find(
				(notification) => notification.id === request.params.id,
			);
			if (!notify) {
				return reply.status(core.codes.notFound).send({
					code: core.Utils.foldCodes.dbNotFound,
					message: "Notification not found!",
				});
			}

			if (notify.title === "Warn") {
				const remaining =
					WARN_LOCK_MS - (Date.now() - notify.createdAt.getTime());
				if (remaining > 0) {
					return reply.status(core.codes.forbidden).send({
						code: core.codes.forbidden,
						message: `Notification cannot be deleted for ${formatDuration(remaining)}`,
					});
				}
			}

			await core.db.updateUser(
				{ id: auth.user.id },
				{
					$pull: {
						notifs: {
							id: request.params.id,
						},
					},
				},
			);
			return reply.status(core.codes.ok).send({
				code: core.codes.ok,
				message: "OK",
			});
		},
	});
	fastify.log.info(`Initialized DELETE User Notification at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
