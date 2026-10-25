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
import type { Options } from "got";
import type { Core } from "../../../../internals.js";
import Path from "../../../../Structures/path.js";

/**
 * @classdesc SHorten links endpoint
 */
class Shorten extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API Shorten Link";
		this.path = "/link";
		this.type = "post";
		this.reqAuth = true;

		this.options = {
			schema: {
				body: {
					type: "object",
					properties: {
						url: { type: "string" },
					},
					required: ["url"],
				},
				response: {
					"4xx": {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "number" },
						},
					},
					200: {
						type: "string",
					},
				},
			},
		};
	}

	async execute(
		request: FastifyRequest<{
			Body: {
				url: string;
			};
			Headers: {
				preferredURL?: string;
			};
		}>,
		response: FastifyReply,
	) {
		const auth = await this.checkAuth(request);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: "Authorization failed.",
			});
		}

		// Every way this can fail gets the same response, so it can't be used to
		// probe which hosts exist or are reachable from this server
		let url: URL;
		try {
			url = new URL(request.body.url);
			if (
				!["http:", "https:"].includes(url.protocol) ||
				this.Utils.isIPHost(url.href)
			) {
				throw new Error("URL DISALLOWED");
			}

			await this.core.got.head(url.href, {
				timeout: 3000,
				retry: 0,
				maxRedirects: 1,
				// Rejects names that resolve to private addresses. IP literals never
				// reach a lookup, so those are checked above and on every redirect.
				// got types this as an overloaded function, but Node only ever calls
				// the (hostname, options, callback) form that this implements
				lookup: this.Utils
					.noPrivateDnsLookup as unknown as Options["lookup"],
				hooks: {
					beforeRedirect: [
						(options) => {
							if (this.Utils.isIPHost(options.url.href)) {
								throw new Error("URL DISALLOWED");
							}
						},
					],
				},
			});
		} catch (error: unknown) {
			if (error instanceof Error) {
				this.core.logger.debug(
					`Shorten rejected a URL: ${error.message}`,
				);
			}

			return response.status(this.codes.notFound).send({
				code: this.Utils.foldCodes.shortUrlNotFound,
				message: "URL not found!",
			});
		}

		const ID = await this.Utils.genShortId();
		await Promise.all([
			this.core.db.makeLink(ID, auth.id, url.toString()),
			this.core.db.updateUser({ id: auth.id }, { $inc: { links: 1 } }),
		]);

		return response
			.status(this.codes.ok)
			.send(
				`${
					request.headers?.responseURL &&
					typeof request.headers.responseURL === "string" &&
					auth.cURLs.includes(request.headers.responseURL) &&
					(
						await this.Utils.testMirrorURL(
							request.headers.responseURL,
						)
					)
						? request.headers.responseURL
						: await this.Utils.determineHomeURL(request)
				}/l/${ID}`,
			);
	}
}

export default Shorten;
