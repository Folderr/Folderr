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

/**
 * @classdesc Ban a user via ID
 */
class Ban extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/Admin Ban";

		this.path = "/admin/ban/:id";
		this.type = "post";

		this.options = {
			schema: {
				body: {
					type: "object",
					properties: {
						reason: { type: "string" },
					},
					required: ["reason"],
				},
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
			Body: {
				reason: string;
			};
			Params: {
				id: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		const auth = await this.checkAuthAdmin(request);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: "Authorization failed.",
			});
		}

		if (!this.Utils.isValidFolderrId(request.params.id)) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: "Missing requirements",
			});
		}

		const user = await this.core.db.findUser({ id: request.params.id });
		if (!user) {
			return response.status(this.codes.notFound).send({
				code: this.Utils.foldCodes.dbNotFound,
				message: "User not found!",
			});
		}

		const ban = await this.core.db.addBan(
			user.email,
			user.id,
			request.body.reason
		);
		if (ban) {
			if (this.core.emailer.active) {
				const url = await this.Utils.determineHomeURL(request);
				await this.core.emailer.banEmail(
					user.email,
					request.body.reason,
					user.username,
					url
				);
			}

			this.core.addDeleter(user.id);
			await this.core.db.markUserForDeletion(user.id);
			return response.status(this.codes.ok).send({
				code: this.codes.ok,
				message: "OK",
			});
		}

		return response.status(this.codes.notAccepted).send({
			code: this.codes.notAccepted,
			message: "BAN FAILED",
		});
	}
}

export default Ban;
