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
 * @classdesc Allow the user to delete a shortened link
 */
class DeleteLink extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API Delete Link";
		this.path = "/link/:id";

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
		// Check auth
		const auth = await this.checkAuth(request);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: "Authorization failed.",
			});
		}

		// Check query
		if (!request.params?.id) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: "MISSING ID!",
			});
		}

		const short = await this.core.db.purgeLink({
			id: request.params.id,
			owner: auth.id,
		});
		if (!short) {
			return response.status(this.codes.notFound).send({
				code: this.Utils.foldCodes.dbNotFound,
				message: "Link not found!",
			});
		}

		return response
			.status(this.codes.ok)
			.send({ code: this.codes.ok, message: "OK" });
	}
}

export default DeleteLink;
