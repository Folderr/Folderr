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
import type { Core } from "../../../../internals";
import Path from "../../../../Structures/path";
import type { User } from "../../../../Structures/Database/db-class";
import type { RequestGallery } from "../../../../../types/fastify-request-types";

/**
 * @classdesc Shows users to admins
 */
class Users extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/Admin View Users";
		this.path = "/admin/users";
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
							message: { type: "array" },
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
			Querystring: RequestGallery;
		}>,
		response: FastifyReply
	) {
		const auth = await this.checkAuthAdmin(request);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: "Authorization failed.",
			});
		}

		const generated = this.generateGenericQuery(request);
		if (generated.errored) {
			const genType = generated as unknown as {
				httpCode: number;
				json: Record<string, string | number>;
				errored: boolean;
			};
			return response.status(genType.httpCode).send(genType.json);
		}

		const { query, options } = generated as unknown as {
			query: {
				$gt?: { created: Date };
				$lt?: { created: Date };
			};
			options: {
				sort?: Record<string, unknown>;
				limit?: number;
			};
			errored: boolean;
		};

		const users: User[] = await this.core.db.findUsers(query, options);
		if (users.length === 0) {
			return response.status(this.codes.ok).send({
				code: this.Utils.foldCodes.dbNotFound,
				message: [],
			});
		}

		const array: Array<{
			title?: string | boolean;
			username: string;
			files: number;
			links: number;
			id: string;
			created: number;
		}> = users.map((user: User) => ({
			title: user.owner ? "owner" : (user.admin && "admin") ?? "user",
			username: user.username,
			email: user.email,
			files: user.files,
			links: user.links,
			id: user.id,
			created: Math.round(user.createdAt.getTime() / 1000),
		}));
		return response
			.status(this.codes.ok)
			.send({ code: this.codes.ok, message: array });
	}
}

export default Users;
