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

/**
 * How uploads are typed and served.
 * Uploading checks what a file really is and rejects it when that disagrees with
 * its extension; serving decides, from the allowlist below, whether its type may
 * be shown inline.
 */

import type { FastifyReply } from "fastify";
import { createReadStream } from "fs";
import { open } from "fs/promises";
import { join } from "path";
import process from "process";
import {
	baseType,
	EXTENSION,
	isInline,
	OCTET_STREAM,
} from "../../security/files";

/** The largest upload accepted, in bytes */
export const MAX_UPLOAD_BYTES = 10_000_000_000;

/** The upload limit as people read it */
export const MAX_UPLOAD_LABEL = `${MAX_UPLOAD_BYTES / 1_000_000_000} GB`;

/** Where uploads are stored */
export const FILES_DIR = join(process.cwd(), "Files");

/**
 * The extension to store an upload under: lowercase, "" when the name has none
 * (dotfiles included), or undefined when it isn't safe to use in a path or URL.
 */
export function uploadExtension(filename: string): string | undefined {
	const dot = filename.lastIndexOf(".");
	if (dot <= 0) {
		return "";
	}

	const ext = filename.slice(dot + 1).toLowerCase();
	return EXTENSION.test(ext) ? ext : undefined;
}

/** An upload's file and link name: "<id>.<ext>", or just "<id>" when it has no extension */
export function uploadName(id: string, ext: string): string {
	return ext ? `${id}.${ext}` : id;
}

/** Where an upload is stored on disk */
export function uploadPath(id: string, ext: string): string {
	return join(FILES_DIR, uploadName(id, ext));
}

/** Splits a link's last part back into the upload's ID and extension: "abc.png" -> abc, png */
export function parseUploadName(name: string): { id: string; ext: string } {
	const dot = name.indexOf(".");
	return dot === -1
		? { id: name, ext: "" }
		: { id: name.slice(0, dot), ext: name.slice(dot + 1) };
}

/** Which link route an upload is served from */
export function routeType(contentType: string): "image" | "video" | "file" {
	if (isInline(contentType)) {
		const base = baseType(contentType);
		if (base.startsWith("image/")) {
			return "image";
		}

		if (base.startsWith("video/")) {
			return "video";
		}
	}

	return "file";
}

/** The first bytes of a saved upload */
export async function readStart(path: string, length: number): Promise<Buffer> {
	const handle = await open(path, "r");
	try {
		const buffer = Buffer.alloc(length);
		const { bytesRead } = await handle.read(buffer, 0, length, 0);
		return buffer.subarray(0, bytesRead);
	} finally {
		await handle.close();
	}
}

/**
 * Sends a stored upload. Only allowlisted types are shown inline; everything
 * else, SVG and HTML included, downloads. Files uploaded before contentType was
 * stored fall back to their extension.
 */
export function sendUpload(
	reply: FastifyReply,
	upload: { id: string; ext: string; contentType: string },
): FastifyReply {
	const type = baseType(upload.contentType);
	const inline = isInline(type);

	let contentType = OCTET_STREAM;
	if (inline) {
		contentType =
			type === "text/plain" ? "text/plain; charset=utf-8" : type;
	}

	return reply
		.status(200)
		.header("Content-Type", contentType)
		.header(
			"Content-Disposition",
			inline
				? "inline"
				: `attachment; filename="${uploadName(upload.id, upload.ext)}"`,
		)
		.header("X-Content-Type-Options", "nosniff")
		.send(createReadStream(uploadPath(upload.id, upload.ext)));
}
