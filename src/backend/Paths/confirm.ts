/**
 * @license
 *
 * core is an open source image host. https://github.com/core
 * Copyright (C) 2020 core
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
import argon2 from "argon2";
import type { Core } from "../internals";
import Path from "../Structures/path";

/**
 * @classdesc Updating the authorized users account
 */
class ConfirmAcc extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "User Confirm Account";
		// Ideal path: /api/account/confirm/:id/:verification
		// Similar idea for new users: /api/account/verify/:id/:verification
		this.path = "/confirm/:id/:verification";

		this.type = "get";
		this.reqAuth = true;
		this.options = {
			schema: {
				response: {
					/* eslint-disable @typescript-eslint/naming-convention */
					"4xx": {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "number" },
						},
					},
					"5xx": {
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
				verification: string;
				id: string;
			};
		}>,
		response: FastifyReply
	) {
		console.log(request.params);
		const user = await this.core.app.db.findUser({
			id: request.params.id,
		});
		if (user?.pendingEmailToken) {
			const verify = await argon2.verify(
				user.pendingEmailToken,
				request.params.verification
			);
			if (!verify) {
				return response.code(this.core.app.codes.notAccepted).send({
					message: "Incorrect code.",
					code: this.core.Utils.foldCodes.noUpdate,
				});
			}

			await this.core.app.db.updateUser(
				{ id: user.id },
				{ email: user.pendingEmail, pendingEmailToken: undefined }
			);
			return response.status(this.core.app.codes.ok).send({
				code: this.core.Utils.foldCodes.UserAccepted,
				message: "Updated Email",
			});
		}

		return response.code(this.core.app.codes.ok).send({
			message:
				"Not verified. User doesn't have a code or user was never found.",
			code: this.core.Utils.foldCodes.noUpdate,
		});
	}
}

export default ConfirmAcc;
