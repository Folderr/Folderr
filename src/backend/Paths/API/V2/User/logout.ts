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

import { type FastifyReply, type FastifyRequest } from "fastify";
import { type Core } from "../../../../internals.js";
import Path from "../../../../Structures/path.js";

class Logout extends Path {
	readonly #sameSite: "strict" | undefined;

	readonly #secure: boolean;

	constructor(core: Core) {
		super(core);
		this.label = "Logout";
		this.path = "/logout";
		this.enabled = true;
		this.options = {
			schema: {
				querystring: {
					everywhere: {
						type: "boolean",
					},
				},
			},
		};

		this.#sameSite = "strict";
		this.#secure = true;
		if (process.env.NODE_ENV === "dev") {
			this.#secure = false;
			this.#sameSite = undefined;
		}
	}

	/**
	 * @desc Logs you out or displays the deleted account page
	 */
	async execute(
		request: FastifyRequest<{
			Querystring: {
				everywhere?: boolean;
			};
		}>,
		response: FastifyReply
	) {
		if (request.query.everywhere) {
			const auth = await this.checkAuth(request);

			if (!auth) {
				return response
					.status(this.codes.unauth)
					.send({ message: "Unauthorized", code: this.codes.unauth });
			}

			const revoked = await this.Utils.authorization.revokeAll(
				auth.id,
				true
			);
			if (!revoked) {
				return response.status(this.codes.internalErr).send({
					message: "Could not logout",
					code: this.codes.internalErr,
				});
			}

			console.log("Hi");

			if (request.cookies.token) {
				return response
					.clearCookie("token", {
						sameSite: this.#sameSite,
						httpOnly: true,
						secure: this.#secure,
					})
					.status(this.codes.ok)
					.send({ messsage: "Logged out", code: this.codes.ok });
			}

			return response
				.status(this.codes.ok)
				.send({ message: "Logged out", code: this.codes.ok });
		}

		if (!request.cookies.token) {
			return response.redirect("/");
		}

		const revoked = await this.Utils.authorization.revoke(
			request.cookies.token,
			true
		);
		if (!revoked) {
			return response.status(this.codes.internalErr).send({
				message: "Could not logout",
				code: this.codes.internalErr,
			});
		}

		return response
			.clearCookie("token", {
				sameSite: this.#sameSite,
				httpOnly: true,
				secure: this.#secure,
			})
			.status(this.codes.ok)
			.send({ message: "Logged out", code: this.codes.ok });
	}
}

export default Logout;
