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

import { createReadStream } from "fs";
import mime from "mime-types";
import { type FastifyReply, type FastifyRequest } from "fastify";
import { type Core } from "../internals.js";
import Path from "../Structures/path.js";

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
		response: FastifyReply
	): Promise<FastifyReply | void> {
		if (!request.params?.id) {
			return response.status(this.codes.badReq).send("Missing image ID");
		}

		if (!request.params.id.includes(".")) {
			return response
				.status(this.codes.badReq)
				.send("Missing file extension!");
		}

		const parts = request.params.id.split(".");
		if (!parts[1]) {
			return response
				.status(this.codes.badReq)
				.send("Missing file extension!");
		}

		const image = await this.core.db.findFile(
			{ id: parts[0], type: "image" },
			"type path owner"
		);
		if (image) {
			const owner = await this.core.db.findUser({ id: image.owner });
			if (!owner) {
				this.core.addDeleter(image.owner);
				return response
					.status(this.codes.notFound)
					.send("404 Not Found");
			}
		}

		if (!image || (image?.type && image.type !== "image")) {
			return response.status(this.codes.notFound).send("404 Not Found");
		}

		let content = mime.contentType(image.path);
		const array = image.path.split(".");
		if (array[array.length - 1] !== parts[1]) {
			return response.status(this.codes.internalErr);
		}

		if (!content) {
			console.log("Image not found!");
			return response
				.status(this.codes.notFound)
				.send("Image type not found!");
		}

		if (content === image.path) {
			content = `image/${array[array.length - 1].toLowerCase()}`;
		}

		return response
			.header("Content-Type", content)
			.status(200)
			.send(createReadStream(image.path));

		// Return response.header('Content-Type', content).sendFile(image.path);
	}
}

export default Images;
