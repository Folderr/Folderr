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
import { type Upload } from "../../../../Structures/Database/db-class.js";
import { type RequestGallery } from "../../../../../types/fastify-request-types.js";
import Path from "../../../../Structures/path.js";

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
				querystring: {
					type: "object",
					properties: {
						gallery: { type: "boolean" },
						limit: { type: "number" },
						before: { type: "object" },
						after: { type: "object" },
					},
				},
				response: {
					// eslint-disable-next-line @typescript-eslint/naming-convention
					"4xx": {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "number" },
						},
					},
					// eslint-disable-next-line @typescript-eslint/naming-convention
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

	async execute(
		request: FastifyRequest<{
			Querystring: RequestGallery;
			Headers: {
				preferredURL?: string;
			};
		}>,
		response: FastifyReply
	): Promise<FastifyReply> {
		const auth = await this.checkAuth(request);
		if (!auth || typeof auth === "string") {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: "Authorization failed.",
			});
		}

		const generated = this.generatePageQuery(request, auth.id);
		if (generated.errored) {
			const genType = generated as unknown as {
				httpCode: 406;
				json: Record<string, string | number>;
				errored: boolean;
			};
			return response.status(genType.httpCode).send(genType.json);
		}

		const { query, options } = generated as unknown as {
			query: {
				$gt?: { created: Date };
				$lt?: { created: Date };
				owner: string;
			};
			options: {
				sort?: Record<string, unknown>;
				limit?: number;
			};
			errored: boolean;
		};

		const images: Upload[] = await this.core.db.findFiles(query, options);
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
		const files = images.map((image: Upload) => {
			const split = image.path.split(".");
			const type = split[split.length - 1];
			return {
				id: image.id,
				type: image.type,
				created: Math.round(image.createdAt.getTime() / 1000),
				link: `${url}/${image.type ? image.type[0] : "i"}/${
					image.id
				}.${type}`,
			};
		});
		return response
			.status(this.codes.ok)
			.send({ code: this.codes.ok, message: files });
	}
}

export default Files;
