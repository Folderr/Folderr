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
import type { Core } from "../../../../internals";
import Path from "../../../../Structures/path";

/**
 * @classdesc Delete an admin notification.
 */
class DelAdminNotify extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/Admin Delete notification";
		this.path = "/admin/notification/:id";
		this.reqAuth = true;

		this.type = "delete";

		this.options = {
			schema: {
				params: {
					type: "object",
					properties: {
						id: { type: "string" },
					},
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
	/* eslint-enable @typescript-eslint/naming-convention */

	async execute(
		request: FastifyRequest<{
			Params: {
				id: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		// Authorize the user as admin, or throw error.
		const auth = await this.checkAuthAdmin(request);
		if (!auth || typeof auth === "string") {
			return response
				.status(this.codes.unauth)
				.send("Authorization failed."); // Unauthorized
		}

		// In case they forgot the ID for the notification
		if (!request.params?.id) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: "Missing notification ID",
			});
		}

		// Find the notification or try to
		const notify = await this.core.db.findAdminNotify({
			id: request.params.id,
		});
		if (!notify) {
			return response.status(this.codes.notFound).send({
				code: this.Utils.foldCodes.dbNotFound,
				message: "Notification not found!",
			});
		}

		// Signup notifications are invincible, at least to manually remove
		if (notify.title === "New user signup!") {
			return response.status(this.codes.forbidden).send({
				code: this.codes.forbidden,
				message: "Signup notifications cannot be removed!",
			});
		}

		// Remove the admin notification and tell the admin it was removed
		await this.core.db.purgeAdminNotify({ id: request.params.id });
		this.core.logger.info(
			`[SYSTEM] Admin notification ${notify.id} removed by ${auth.username}!`
		);
		return response
			.status(this.codes.ok)
			.send({ code: this.codes.ok, message: "OK" });
	}
}

export default DelAdminNotify;
