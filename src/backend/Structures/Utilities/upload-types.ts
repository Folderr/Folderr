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
 * Uploading records what a file really is (its contentType); serving decides,
 * from the allowlist below, whether that type may be shown inline.
 */

import type { FastifyReply } from "fastify";
import { createReadStream } from "fs";
import mime from "mime-types";
import { extname } from "path";
import { Transform, type TransformCallback } from "stream";

export const OCTET_STREAM = "application/octet-stream";

/** Bytes to keep from the start of an upload, enough for file-type to identify it */
export const SNIFF_BYTES = 4100;

const EXTENSION = /^[a-z0-9]{1,10}$/;

/**
 * Types that are safe to show inline: they can't run scripts in a browser.
 * Anything else is sent as a download. Both spellings are listed where
 * file-type (new uploads) and mime-types (older uploads) name a format differently.
 */
const INLINE_TYPES = new Set([
	// Images
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/webp",
	"image/avif",
	"image/apng",
	"image/bmp",
	"image/x-icon",
	"image/vnd.microsoft.icon",
	// Video
	"video/mp4",
	"video/webm",
	"video/ogg",
	"video/quicktime",
	"video/x-m4v",
	"video/matroska",
	"video/x-matroska",
	// Audio
	"audio/mpeg",
	"audio/mp4",
	"audio/x-m4a",
	"audio/aac",
	"audio/x-aac",
	"audio/ogg",
	"audio/opus",
	"audio/wav",
	"audio/wave",
	"audio/x-wav",
	"audio/flac",
	"audio/x-flac",
	"audio/webm",
	// Text
	"text/plain",
]);

/** The same formats under different names, so a detected type can be compared with a looked-up one */
const ALIASES: Record<string, string> = {
	"audio/wave": "audio/wav",
	"audio/x-wav": "audio/wav",
	"audio/x-flac": "audio/flac",
	"audio/x-aac": "audio/aac",
	"audio/x-m4a": "audio/mp4",
	"image/vnd.microsoft.icon": "image/x-icon",
	"video/x-matroska": "video/matroska",
	"video/vnd.avi": "video/x-msvideo",
};

/** "Audio/OGG; codecs=opus" -> "audio/ogg" */
export function baseType(type: string): string {
	return type.split(";")[0].trim().toLowerCase();
}

function canonicalType(type: string): string {
	const base = baseType(type);
	return ALIASES[base] ?? base;
}

export function isInline(type: string): boolean {
	return INLINE_TYPES.has(baseType(type));
}

/**
 * The extension to store an upload under: lowercase, "bin" when the name has none
 * (dotfiles included), or undefined when it isn't safe to use in a path or URL.
 */
export function uploadExtension(filename: string): string | undefined {
	const dot = filename.lastIndexOf(".");
	if (dot <= 0) {
		return "bin";
	}

	const ext = filename.slice(dot + 1).toLowerCase();
	return EXTENSION.test(ext) ? ext : undefined;
}

/**
 * What an upload really is, from its extension and what file-type found in its first bytes.
 * A file whose bytes disagree with its extension is stored as a plain download.
 */
export function resolveContentType(
	ext: string,
	detected?: { ext: string; mime: string },
): string {
	const claimed = mime.lookup(ext) || undefined;

	if (detected) {
		const agrees =
			detected.ext === ext ||
			(claimed !== undefined &&
				canonicalType(claimed) === canonicalType(detected.mime));
		return agrees ? baseType(detected.mime) : OCTET_STREAM;
	}

	// file-type only recognises binary formats. Without a match, the only inline
	// type a file may claim is plain text, which has no signature to check.
	if (!claimed || (isInline(claimed) && baseType(claimed) !== "text/plain")) {
		return OCTET_STREAM;
	}

	return baseType(claimed);
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

/** Passes a stream through unchanged, keeping a copy of its first bytes */
export class FirstBytes extends Transform {
	readonly #limit: number;

	readonly #chunks: Buffer[] = [];

	#length = 0;

	constructor(limit = SNIFF_BYTES) {
		super();
		this.#limit = limit;
	}

	get bytes(): Buffer {
		return Buffer.concat(this.#chunks);
	}

	override _transform(
		chunk: Buffer,
		_encoding: BufferEncoding,
		callback: TransformCallback,
	): void {
		if (this.#length < this.#limit) {
			const part = Buffer.from(
				chunk.subarray(0, this.#limit - this.#length),
			);
			this.#chunks.push(part);
			this.#length += part.length;
		}

		callback(null, chunk);
	}
}

/**
 * Sends a stored upload. Only allowlisted types are shown inline; everything
 * else, SVG and HTML included, downloads. Files uploaded before contentType was
 * stored fall back to their extension.
 */
export function sendUpload(
	reply: FastifyReply,
	upload: { path: string; contentType?: string },
	id: string,
): FastifyReply {
	const rawExt = extname(upload.path).slice(1);
	const ext = EXTENSION.test(rawExt.toLowerCase())
		? rawExt.toLowerCase()
		: "bin";
	const type = baseType(
		upload.contentType ?? (mime.lookup(rawExt) || OCTET_STREAM),
	);
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
			inline ? "inline" : `attachment; filename="${id}.${ext}"`,
		)
		.header("X-Content-Type-Options", "nosniff")
		.send(createReadStream(upload.path));
}
