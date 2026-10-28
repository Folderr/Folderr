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
import type { Link } from "../../../../Structures/Database/db-class.js";
import Path from "../../../../Structures/path.js";
import {
	generateTimePage,
	PAGINATION_SCHEMA,
	type PageQuery,
} from "../../../../Structures/Utilities/pagination.js";

/**
 * @classdesc Allow a user to access their links
 */
class Links extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/User Links";
		this.path = "/links";
		this.reqAuth = true;

		this.options = {
			schema: {
				querystring: PAGINATION_SCHEMA,
				response: {
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
							message: {
								type: "array",
								items: {
									type: "object",
									properties: {
										id: { type: "string" },
										points_to: { type: "string" },
										createdAt: { type: "number" }, // Fastify converts the Date to milliseconds
										link: { type: "string" },
									},
								},
							},
							code: { type: "number" },
						},
					},
				},
			},
		};
	}

	async execute(
		request: FastifyRequest<{
			Querystring: PageQuery;
			Headers: {
				preferredURL?: string;
			};
		}>,
		response: FastifyReply,
	): Promise<FastifyReply> {
		// Check auth
		const auth = await this.checkAuth(request);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: "Authorization failed.",
			});
		}

		const page = generateTimePage(
			{
				before: request.query.before,
				after: request.query.after,
				limit: request.query.limit,
			},
			auth.id,
			request.query.ascending,
		);
		if (!page) {
			return response.status(this.codes.badReq).send({
				code: this.codes.badReq,
				message: "Request poorly formed, the querystring is invalid",
			});
		}

		const shorts: Link[] = await this.core.db.findLinks(
			page.filter,
			page.options,
		);
		if (!shorts || shorts.length === 0) {
			return response
				.status(this.codes.ok)
				.send({ code: this.codes.ok, message: [] });
		}

		let url =
			request.headers?.responseURL &&
			typeof request.headers.responseURL === "string" &&
			auth.cURLs.includes(request.headers.responseURL) &&
			(await this.Utils.testMirrorURL(request.headers.responseURL))
				? request.headers.responseURL
				: await this.Utils.determineHomeURL(request);
		url = url.replace(/\/$/g, "");
		const aShorts = shorts.map((short: Link) => ({
			id: short.id,
			points_to: short.link,
			createdAt: short.createdAt,
			link: `${url}/${short.id}`,
		}));

		return response
			.status(this.codes.ok)
			.send({ code: this.codes.ok, message: aShorts });
	}
}

export default Links;
