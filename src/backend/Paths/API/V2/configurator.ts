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
import { type Core } from "../../../internals";
import Path from "../../../Structures/path";
import Configurator from "../../../Structures/Utilities/sharex-configurator";

/**
 * @classdesc Generate a sharex configuration
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
class ShareXConfigurator extends Path {
	private readonly configurator: Configurator;

	constructor(core: Core) {
		super(core);
		this.label = "API/Authorized Configurator";
		this.path = "/sharex/config";
		this.type = "post";
		this.configurator = new Configurator();

		this.options = {
			schema: {
				body: {
					type: "object",
					properties: {
						token: { type: "string" },
					},
					required: ["token"],
				},
				querystring: {
					type: "object",
					properties: {
						d: { type: "string" },
					},
				},
			},
		};
	}

	/**
	 * @desc Generate a ShareX configuration
	 */
	async execute(
		request: FastifyRequest<{
			Body: {
				token: string;
			};
			Headers: {
				preferredURL?: string;
			};
			Querystring: {
				d?: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		const auth = await this.checkAuth(request);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: "Authorization failed.",
			});
		}

		const compare = await this.Utils.authorization.verifyAccount(
			request.body.token
		);
		if (!compare) {
			return response.status(this.codes.unauth).send({
				code: this.codes.notAccepted,
				message: "Invalid Token!",
			});
		}

		const url = await this.Utils.determineHomeURL(request);

		const config = this.configurator.generateFiles(url, request.body.token);
		if (request.query && request.query.d === "file") {
			return response
				.type("text/plain; charset=binary")
				.header(
					"Content-Disposition",
					"attachment; filename=Folderr-Link-Config.sxcu"
				)
				.status(this.codes.ok)
				.send(config[0]);
		}

		if (request.query?.d && request.query.d === "link") {
			return response
				.type("text/plain; charset=binary")
				.header(
					"Content-Disposition",
					"attachment; filename=Folderr-Link-Config.sxcu"
				)
				.status(this.codes.ok)
				.send(config[1]);
		}

		return response
			.status(this.codes.ok)
			.send({ code: this.codes.ok, message: config });
	}
}

export default ShareXConfigurator;
