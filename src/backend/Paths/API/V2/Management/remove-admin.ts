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
 * @classdesc Remove an administrators admin status
 */
class RemoveAdmin extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/Management Remove Admin";
		this.path = "/manage/admin/:id";
		this.reqAuth = true;

		this.type = "delete";

		this.options = {
			schema: {
				params: {
					type: "object",
					properties: {
						id: { type: "string" },
					},
					required: ["id"],
				},
				body: {
					type: "object",
					properties: {
						reason: { type: "string" },
					},
					required: ["reason"],
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
		// Actually check auth, and make sure they are the owner
		const auth = await this.Utils.checkAuth(request, true, true);
		if (auth.code !== 200) {
			return response.status(auth.code).send({
				code: auth.code,
				message: "Authorization failed.",
			});
		}

		if (!this.Utils.isValidFolderrId(request.params.id)) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: "ID is not a valid Folderr ID",
			});
		}

		// Why $nor includes owner: We don't modify the owner's admin status.
		// Why $nor: So we don't get users that aren't admin. This way we only find the user if they
		// 1. Are an admin and, 2. aren't the owner
		const user = await this.core.db.findAndUpdateUser(
			{
				id: request.params.id,
				$nor: [{ admin: false }, { owner: true }],
			},
			{ admin: false },
			"admin"
		);
		if (!user) {
			return response.status(this.codes.notFound).send({
				message: "User not found",
				code: this.Utils.foldCodes.dbNotFound,
			});
		}

		if (user.admin) {
			return response.status(this.codes.notAccepted).send({
				message: "Demotion Failed",
				code: this.Utils.foldCodes.dbUnkownError,
			});
		}

		const responsible = `${auth.user.username} (${auth.user.id})`;
		const formerAdmin = `${user.username} (${user.id})`;
		this.core.logger.info(
			`Administator removed for ${formerAdmin} by ${responsible}`
		);
		return response.status(this.codes.ok).send({
			code: this.codes.ok,
			message: "OK",
		});
	}
}

export default RemoveAdmin;
