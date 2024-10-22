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
import type { Tokendb } from "../../../../Structures/Database/db-class.js";

/**
 * @classdesc Allow a user to generate a token
 */
class GenToken extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/User Generate API Token";
		this.path = "/account/token";

		this.type = "post";
		this.reqAuth = true;

		this.options = {
			schema: {
				body: {
					description: {
						type: "string",
						maxLength: 50,
					},
				},
				querystring: {
					type: "object",
					properties: {
						override: { type: "boolean" },
					},
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
			Querystring: {
				override: boolean;
			};
			Body: {
				description?: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		// Check auth
		const auth = await this.checkAuth(request);
		if (!auth || typeof auth === "string") {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: "Authorization failed.",
			});
		}

		const tokens = await this.core.db.findTokens(auth.id, { web: false });
		this.core.logger.debug(tokens.length >= 10 && !request.query.override);

		if (tokens.length > 10 && !request.query.override) {
			return response.status(this.codes.forbidden).send({
				// This is string
				code: this.Utils.foldCodes.tokenSizeLimit,
				/* eslint-disable max-len */
				message:
					'You have maxed out your tokens! Either delete one or re-request with "?override=true" at the end of the url (This will delete the first one created).',
				/* eslint-enable max-len */
			});
		}

		if (tokens.length >= 10 && request.query.override) {
			const tkns = tokens.sort(
				(a: Tokendb, b: Tokendb) =>
					Number(a.createdAt) - Number(b.createdAt)
			);
			await this.core.db.purgeToken(tkns[0].id, tkns[0].userID, {
				web: false,
			});
		}

		const token = await this.Utils.authorization.genKey(
			auth.id,
			request.body.description
		);
		return response
			.status(this.codes.created)
			.send({ code: this.codes.ok, message: token });
	}
}

export default GenToken;
