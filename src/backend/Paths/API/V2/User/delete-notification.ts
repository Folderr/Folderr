/**
 * @license
 *
 * Folderr is an open source image host. https://github.com/Folderr
 * Copyright (C) 2020 Folderr
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import type { FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../../internals.js";
import Path from "../../../../Structures/path.js";

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

/**
 * @classdesc User can delete a single notification
 */
class DelNotify extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/User Delete notification";
		this.path = "/notification/:id";

		this.type = "delete";
		this.reqAuth = true;

		this.options = {
			schema: {
				params: {
					type: "object",
					properties: {
						id: { type: "string" },
					},
					required: ["id"],
				},
				response: {
					"4xx": {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "number" },
						},
					},
					500: {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "number" },
						},
					},
					200: {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "number" },
						},
					},
				},
			},
		};
	}

	async execute(
		request: FastifyRequest<{
			Params: {
				id: string;
			};
		}>,
		response: FastifyReply,
	): Promise<FastifyReply> {
		// Check auth
		const auth = await this.checkAuth(request);
		if (!auth || typeof auth === "string") {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: "Authorization failed.",
			});
		}

		// Check query
		if (!request.params?.id) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: "Missing notification ID",
			});
		}

		// Grab the users notifications, and find the one they are looking for
		const { notifs } = auth;
		if (!notifs) {
			return response.status(this.codes.notFound).send({
				code: this.codes.notFound,
				message: "You have no notifications!",
			});
		}

		const notify = notifs.find(
			(notification) => notification.id === request.params.id,
		);
		// If no notification, tell the user that notification does not exist
		if (!notify) {
			return response.status(this.codes.notFound).send({
				code: this.Utils.foldCodes.dbNotFound,
				message: "Notification not found!",
			});
		}

		if (notify.title === "Warn") {
			const remaining =
				WARN_LOCK_MS - (Date.now() - notify.createdAt.getTime());
			if (remaining > 0) {
				return response.status(this.codes.forbidden).send({
					code: this.codes.forbidden,
					message: `Notification cannot be deleted for ${formatDuration(remaining)}`,
				});
			}
		}

		// Remove the notification, update the users account, and return success
		await this.core.db.updateUser(
			{ id: auth.id },
			{
				$pull: {
					notifs: {
						id: request.params.id,
					},
				},
			},
		);
		return response.status(this.codes.ok).send({
			code: this.codes.ok,
			message: "OK",
		});
	}
}

export default DelNotify;
