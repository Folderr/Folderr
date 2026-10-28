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
import type { Upload } from "../../../../Structures/Database/db-class.js";
import Path from "../../../../Structures/path.js";
import {
	generateTimePage,
	PAGINATION_SCHEMA,
	type PageQuery,
} from "../../../../Structures/Utilities/pagination.js";
import {
	routeType,
	uploadName,
} from "../../../../Structures/Utilities/upload-types.js";

/**
 * @classdesc Send users their files
 */
class Files extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API/User Files";
		this.path = "/files";
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
										type: { type: "string" },
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
		const auth = await this.checkAuth(request);
		if (!auth || typeof auth === "string") {
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

		const images: Upload[] = await this.core.db.findFiles(
			page.filter,
			page.options,
		);
		if (!images) {
			return response
				.status(this.codes.ok)
				.send({ code: this.codes.noContent, message: [] });
		}

		let url =
			request.headers?.responseURL &&
			typeof request.headers.responseURL === "string" &&
			auth.cURLs.includes(request.headers.responseURL) &&
			(await this.Utils.testMirrorURL(request.headers.responseURL))
				? request.headers.responseURL
				: await this.Utils.determineHomeURL(request);
		url = url.replace(/\/$/g, "");
		const files = images.map((image: Upload) => ({
			id: image.id,
			type: routeType(image.contentType),
			createdAt: image.createdAt,
			link: `${url}/${routeType(image.contentType)[0]}/${uploadName(
				image.id,
				image.ext,
			)}`,
		}));
		return response
			.status(this.codes.ok)
			.send({ code: this.codes.ok, message: files });
	}
}

export default Files;
