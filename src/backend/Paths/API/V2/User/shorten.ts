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
					/* eslint-disable @typescript-eslint/naming-convention */
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
	/* eslint-enable @typescript-eslint/naming-convention */

	async execute(
		request: FastifyRequest<{
			Body: {
				url: string;
			};
			Headers: {
				preferredURL?: string;
			};
		}>,
		response: FastifyReply
	) {
		const auth = await this.checkAuth(request);
		if (!auth) {
			return response.status(this.codes.unauth).send({
				code: this.codes.unauth,
				message: "Authorization failed.",
			});
		}

		try {
			const url = new URL(request.body.url);
			await this.core.got.get(url.toString());
		} catch (error: any) {
			/* eslint-disable @typescript-eslint/no-unsafe-call */
			if (
				(error.code &&
					typeof error.code === "string" &&
					error.code === "ENOTFOUND") ||
				(error.message &&
					typeof error.message === "string" &&
					error.message.includes("EAI_AGAIN"))
			) {
				/* eslint-enable @typescript-eslint/no-unsafe-call */
				return response.status(this.codes.notFound).send({
					code: this.Utils.foldCodes.shortUrlNotFound,
					message: "URL not found!",
				});
			}

			if (error.message && typeof error.message === "string") {
				this.core.logger.debug(error.message);
			}

			return response.status(this.codes.notAccepted).send({
				code: this.Utils.foldCodes.unkownError,
				message: "Unknown error occured",
			});
		}

		// eslint-disable-next-line @typescript-eslint/naming-convention
		const ID = await this.Utils.genShortId();
		await Promise.all([
			this.core.db.makeLink(ID, auth.id, request.body.url),
			this.core.db.updateUser({ id: auth.id }, { $inc: { links: 1 } }),
		]);

		return response
			.status(this.codes.ok)
			.send(
				`${
					request.headers?.responseURL &&
					typeof request.headers.responseURL === "string" &&
					auth.cURLs.includes(request.headers.responseURL) &&
					(await this.Utils.testMirrorURL(
						request.headers.responseURL
					))
						? request.headers.responseURL
						: await this.Utils.determineHomeURL(request)
				}/l/${ID}`
			);
	}
}

export default Shorten;
