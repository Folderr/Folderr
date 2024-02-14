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
 * @classdesc View the admin notification
 */
class AdminNotification extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/Admin Notification";
		this.path = "/admin/notification/:id";
		this.reqAuth = true;

		this.type = "get";
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
		// Check auth
		const auth = await this.checkAuthAdmin(request);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: "Authorization failed.",
			});
		}

		// Verify query
		if (!request.params.id) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: "Notification ID required!",
			});
		}

		// Find notification. If not found, return a not found status code
		const notify = await this.core.db.findAdminNotify({
			id: request.params.id,
		});
		if (!notify) {
			return response.status(this.codes.noContent).send({
				code: this.Utils.foldCodes.dbNotFound,
				message: [],
			});
		}

		// Oh look a notification!
		return response
			.status(this.codes.ok)
			.send({ code: this.codes.ok, message: notify });
	}
}

export default AdminNotification;
