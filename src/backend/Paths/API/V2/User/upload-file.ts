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
import { fileTypeFromBuffer } from "file-type";
import { createWriteStream } from "fs";
import { rename, unlink } from "fs/promises";
import { pipeline } from "stream";
import { promisify } from "util";
import type { Core } from "../../../../internals.js";
import Path from "../../../../Structures/path.js";
import {
	checkUploadType,
	FirstBytes,
	isExecutableExtension,
	routeType,
	uploadExtension,
	uploadName,
	uploadPath,
} from "../../../../Structures/Utilities/upload-types.js";

const pump = promisify(pipeline);

/**
 * @classdesc Upload a file
 */
class Image extends Path {
	constructor(core: Core) {
		super(core);
		this.label = "API Upload File";
		this.path = "/file";
		this.type = "post";
		this.reqAuth = true;

		this.options = {
			schema: {
				response: {
					"4xx": {
						type: "object",
						properties: {
							message: { type: "string" },
							code: { type: "number" },
						},
					},
					500: {
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

		const file = await request.file();

		if (!file?.file) {
			return response.status(this.codes.badReq).send({
				code: this.Utils.foldCodes.noFile,
				message: "File not found!",
			});
		}

		// The name comes from the upload's headers, so these checks run before any
		// of the file is read. Draining it lets the request finish.
		const ext = uploadExtension(file.filename);
		// "" means no extension, which is fine; undefined means an unusable one
		if (ext === undefined) {
			file.file.resume();
			return response.status(this.codes.badReq).send({
				code: this.Utils.foldCodes.securityError,
				message: "Unsupported file extension",
			});
		}

		if (isExecutableExtension(ext)) {
			file.file.resume();
			return response.status(this.codes.badReq).send({
				code: this.Utils.foldCodes.securityError,
				message: "Executable files aren't allowed",
			});
		}

		const id = await this.Utils.genShortId();
		const filePath = uploadPath(id, ext);
		// Keeps the first bytes as the file streams to disk, to check what it really is
		const firstBytes = new FirstBytes();

		try {
			await pump(file.file, firstBytes, createWriteStream(filePath));
		} catch (error: unknown) {
			await unlink(filePath).catch(() => undefined);
			if (
				error instanceof
				this.core.app.multipartErrors.RequestFileTooLargeError
			) {
				return response.status(this.codes.badReq).send({
					code: this.Utils.foldCodes.fileSizeLimit,
					message: "File is over size. Max size is 1GB",
				});
			}

			return response.status(this.codes.internalErr).send({
				code: this.Utils.foldCodes.fileParserError,
				message: `Parser error!\n${
					error instanceof Error ? error.message : (error as string)
				}`,
			});
		}

		if (file.file.truncated) {
			await unlink(filePath);
			return response.status(this.codes.badReq).send({
				code: this.Utils.foldCodes.fileSizeLimit,
				message: "File is over size. Max size is 1GB",
			});
		}

		const detected = await fileTypeFromBuffer(firstBytes.bytes).catch(
			() => undefined,
		);
		const checked = checkUploadType(ext, firstBytes.bytes, detected);
		if (!checked.ok) {
			await unlink(filePath);
			return response.status(this.codes.badReq).send(
				checked.reason === "executable"
					? {
							code: this.Utils.foldCodes.securityError,
							message: "Executable files aren't allowed",
						}
					: {
							code: this.Utils.foldCodes.fileMimeError,
							message:
								"The file's contents don't match its extension",
						},
			);
		}

		// Store it under the extension its contents show (photo.jpeg -> .jpg)
		let storedPath = filePath;
		if (checked.ext !== ext) {
			storedPath = uploadPath(id, checked.ext);
			await rename(filePath, storedPath);
		}

		const { contentType } = checked;
		// Only picks the link's /f, /i or /v prefix; any of them serves the file
		const type = routeType(contentType);

		try {
			await Promise.all([
				this.core.db.makeFile(id, auth.id, {
					contentType,
					ext: checked.ext,
				}),
				this.core.db.updateUser(
					{ id: auth.id },
					{ $inc: { files: 1 } },
				),
			]);
		} catch (error: unknown) {
			console.log(error);
		}

		return response
			.status(this.codes.ok)
			.send(
				`${
					typeof request.headers?.responseURL === "string" &&
					auth.cURLs.includes(request.headers.responseURL) &&
					(
						await this.Utils.testMirrorURL(
							request.headers.responseURL!,
						)
					)
						? request.headers.responseURL
						: await this.Utils.determineHomeURL(request)
				}/${type[0]}/${uploadName(id, checked.ext)}`,
			);
	}
}

export default Image;
