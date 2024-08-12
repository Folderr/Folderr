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

import type { FastifyRequest, FastifyReply } from "fastify";
import type { Core } from "../../../../internals.js";
import Path from "../../../../Structures/path.js";

/**
 * @classdesc Warn a user
 */
class WarnUser extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/Admin Warn User";
		this.path = "/admin/warn/:id";
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
			Headers: {
				preferredURL?: string;
			};
		}>,
		response: FastifyReply
	) {
		const newAuth = await this.Utils.checkAuth(request, true);
		if (newAuth.code !== this.core.codes.ok) {
			return response.status(newAuth.code).send({
				code: newAuth.code,
				message: "Authorization failed.",
			});
		}

		if (!this.Utils.isValidFolderrId(request.params.id)) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: "Requirements missing or invalid!",
			});
		}

		const user = await this.core.db.findUser({ id: request.params.id });
		if (!user) {
			return response.status(this.codes.notFound).send({
				code: this.Utils.foldCodes.dbNotFound,
				message: "User not found!",
			});
		}

		const id = this.Utils.genNotifyID();
		const updated = await this.core.db.updateUser(
			{ id: request.params.id },
			{
				$addToSet: {
					notifs: {
						id,
						title: "Warn",
						notify: `You were warned for: ${request.body.reason}`,
					},
				},
			}
		);
		if (!updated) {
			return response.status(this.codes.notAccepted).send({
				code: this.Utils.foldCodes.unkownError,
				message: "Warn failed",
			});
		}

		if (this.core.emailer.active) {
			const url = await this.Utils.determineHomeURL(request);
			await this.core.emailer.warnEmail(
				user.email,
				request.body.reason,
				user.username,
				url
			);
		}

		return response.status(this.codes.ok).send({
			code: this.codes.ok,
			message: "OK",
		});
	}
}

export default WarnUser;
