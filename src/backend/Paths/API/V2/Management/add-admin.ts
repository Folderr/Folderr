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
 * @classdesc Make a user an administrator
 */
class AddAdmin extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/Management Add Admin";
		this.path = "/manage/admin/:id";
		this.reqAuth = true;

		this.type = "post";

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
		const auth = await this.Utils.checkAuth(request, true, true);
		if (auth.code !== this.codes.ok) {
			return response.status(auth.code).send({
				code: auth.code,
				message: "Authorization failed.",
			});
		}

		// You need to use the query to supply the users ID
		if (!request.params?.id) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: "User ID is required!",
			});
		}

		if (!this.Utils.validateUuid(request.params.id, 4)) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: "ID is not a valid Folderr ID",
			});
		}

		// Why $nor includes owner: We don't modify the owner's admin status.
		// Why $nor: So we don't get users that aren't admin. This way we only find the user if they
		// 1. Aren't an admin and, 2. aren't the owner
		const user = await this.core.db.findAndUpdateUser(
			{
				id: request.params.id,
				$nor: [{ admin: true }, { owner: true }],
			},
			{ admin: true },
			"admin"
		);
		if (!user) {
			return response.status(this.codes.notFound).send({
				message: "User not found",
				code: this.Utils.foldCodes.dbNotFound,
			});
		}

		if (!user.admin) {
			return response.status(this.codes.notAccepted).send({
				message: "Promotion Failed",
				code: this.Utils.foldCodes.dbUnkownError,
			});
		}

		const responsible = `${auth.user.username} (${auth.user.id})`;
		const userFormatted = `${user.username} (${user.id})`;

		// Eventually we'll make an audit log that goes here
		// So all admins can see what every user has done.
		user.admin = true;
		this.core.logger.info(
			`Administrator privileges granted to ${userFormatted} by ${responsible}`
		);
		return response
			.status(this.codes.ok)
			.send({ code: this.codes.ok, message: "OK" });
	}
}

export default AddAdmin;
