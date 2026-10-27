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
import type { Core } from "../internals.js";
import Path from "../Structures/path.js";
import {
	parseUploadName,
	sendUpload,
} from "../Structures/Utilities/upload-types.js";

/**
 * @classdesc Allow images to be accessed over the web
 */
class Images extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "Get image by id";
		this.path = ["/image/:id", "/i/:id"];

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
					"4xx": {
						type: "string",
					},
				},
			},
		};
	}

	/**
	 * @desc Display an image to the user, or the 404 page if image doesn't exist.
	 */
	async execute(
		request: FastifyRequest<{
			Params: {
				id: string;
			};
		}>,
		response: FastifyReply,
	): Promise<FastifyReply | void> {
		// The link names the file as <id>.<ext>, or just <id> when it has no extension
		const { id, ext } = parseUploadName(request.params.id);
		const upload = await this.core.db.findFile(
			{ id, ext, type: "image" },
			"id ext owner contentType",
		);
		if (!upload) {
			return response.status(this.codes.notFound).send("404 Not Found");
		}

		const owner = await this.core.db.findUser({ id: upload.owner });
		if (!owner) {
			this.core.addDeleter(upload.owner);
			return response.status(this.codes.notFound).send("404 Not Found");
		}

		return sendUpload(response, upload);
	}
}

export default Images;
