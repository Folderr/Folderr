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
import { supportedExtensions } from "file-type";
import { createReadStream } from "fs";
import { open } from "fs/promises";
import { join } from "path";
import process from "process";

export const OCTET_STREAM = "application/octet-stream";

/** The largest upload accepted, in bytes */
export const MAX_UPLOAD_BYTES = 10_000_000_000;

/** The upload limit as people read it */
export const MAX_UPLOAD_LABEL = `${MAX_UPLOAD_BYTES / 1_000_000_000} GB`;

/** Where uploads are stored */
export const FILES_DIR = join(process.cwd(), "Files");

const EXTENSION = /^[a-z0-9]{1,10}$/;

/**
 * Types that are safe to show inline: they can't run scripts in a browser.
 * Anything else downloads. These are the names file-type reports.
 */
const INLINE_TYPES = new Set([
	// Images
	"image/png",
	"image/apng",
	"image/jpeg",
	"image/gif",
	"image/webp",
	"image/avif",
	"image/bmp",
	"image/x-icon",
	// Video
	"video/mp4",
	"video/x-m4v",
	"video/webm",
	"video/ogg",
	"video/quicktime",
	"video/matroska",
	// Audio
	"audio/mpeg",
	"audio/mp4",
	"audio/x-m4a",
	"audio/aac",
	"audio/ogg",
	"audio/wav",
	"audio/flac",
	// Text
	"text/plain",
]);

/** Extensions that name the same format, so "photo.jpeg" matches a detected "jpg" */
const EXTENSION_FAMILIES = [
	["jpg", "jpeg", "jpe", "jfif"],
	["tif", "tiff"],
	["png", "apng"],
	["heic", "heif"],
	["mp4", "m4v", "m4a", "m4b"],
	["mov", "qt"],
	["mkv", "mka"],
	["webm", "weba"],
	["ogg", "oga", "ogv", "opus", "spx", "ogx"],
	["mid", "midi"],
];

const FAMILY = new Map(
	EXTENSION_FAMILIES.flatMap((family) =>
		family.map((ext) => [ext, family] as const),
	),
);

function sameFormat(a: string, b: string): boolean {
	return a === b || (FAMILY.get(a)?.includes(b) ?? false);
}

/**
 * Text formats file-type can recognise, but not reliably: valid files often lack
 * the header it looks for (XML without a <?xml …?> line), and an SVG that has one is
 * reported as XML. These are checked by extension only. "dat" is a generic name.
 */
const TEXT_DETECTIONS = new Set([
	"xml",
	"ics",
	"vcf",
	"vtt",
	"ps",
	"eps",
	"rtf",
	"pgp",
	"reg",
	"stl",
	"sav",
	"dat",
]);

/** Programs, installers and scripts that an operating system runs when they're opened */
const EXECUTABLE_EXTENSIONS = new Set([
	// Windows
	"exe",
	"dll",
	"sys",
	"drv",
	"ocx",
	"scr",
	"com",
	"pif",
	"cpl",
	"msi",
	"msp",
	"mst",
	"msix",
	"msixbundle",
	"appx",
	"appxbundle",
	"bat",
	"cmd",
	"ps1",
	"psm1",
	"psd1",
	"vbs",
	"vbe",
	"js",
	"jse",
	"wsf",
	"wsh",
	"wsc",
	"hta",
	"reg",
	"lnk",
	"url",
	"scf",
	"inf",
	"gadget",
	"msc",
	// macOS
	"app",
	"pkg",
	"mpkg",
	"command",
	"dmg",
	"kext",
	"dylib",
	"scpt",
	"workflow",
	"action",
	// Linux and other Unix systems
	"sh",
	"bash",
	"zsh",
	"csh",
	"ksh",
	"fish",
	"run",
	"appimage",
	"elf",
	"so",
	"deb",
	"rpm",
	"snap",
	"flatpak",
	// Java, Android, iOS, WebAssembly and browser extensions
	"jar",
	"class",
	"apk",
	"aab",
	"xapk",
	"ipa",
	"wasm",
	"swf",
	"xpi",
	"crx",
]);

/** Executable formats file-type recognises from their bytes, whatever the file is called */
const EXECUTABLE_DETECTIONS = new Set([
	"exe",
	"elf",
	"macho",
	"wasm",
	"class",
	"jar",
	"apk",
	"xpi",
	"crx",
	"deb",
	"rpm",
	"dmg",
	"lnk",
	"swf",
	"reg",
]);

/** Whether an upload's extension marks it as a program or script */
export function isExecutableExtension(ext: string): boolean {
	return EXECUTABLE_EXTENSIONS.has(ext);
}

/** Whether a file's bytes show it's a program or script, whatever it's called */
function isExecutableContent(
	firstBytes: Buffer,
	detected?: { ext: string },
): boolean {
	if (detected && EXECUTABLE_DETECTIONS.has(detected.ext.toLowerCase())) {
		return true;
	}

	// "#!" starts a script that Unix-like systems run with the interpreter it names
	return firstBytes.subarray(0, 2).toString("latin1") === "#!";
}

/** Whether file-type should have recognised a file with this extension */
function isBinaryFormat(ext: string): boolean {
	if (TEXT_DETECTIONS.has(ext)) {
		return false;
	}

	return (FAMILY.get(ext) ?? [ext]).some((name) =>
		supportedExtensions.has(name as never),
	);
}

/** "Audio/OGG; codecs=opus" -> "audio/ogg" */
export function baseType(type: string): string {
	return type.split(";")[0].trim().toLowerCase();
}

export function isInline(type: string): boolean {
	return INLINE_TYPES.has(baseType(type));
}

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

export type UploadType =
	| {
			ok: true;
			/** The extension to store the file under, as file-type names it when it recognised the file */
			ext: string;
			contentType: string;
	  }
	| { ok: false; reason: "mismatch" | "executable" };

/**
 * Checks an upload's extension against what file-type found in its first bytes.
 * Programs and scripts are rejected, as is a file whose contents disagree with its
 * extension.
 */
export function checkUploadType(
	ext: string,
	firstBytes: Buffer,
	detected?: { ext: string; mime: string },
): UploadType {
	if (
		isExecutableExtension(ext) ||
		isExecutableContent(firstBytes, detected)
	) {
		return { ok: false, reason: "executable" };
	}

	const binary =
		detected && !TEXT_DETECTIONS.has(detected.ext) ? detected : undefined;

	if (binary) {
		const detectedExt = binary.ext.toLowerCase();
		// A file uploaded without an extension takes the one its bytes show
		if (ext === "" || sameFormat(ext, detectedExt)) {
			return {
				ok: true,
				// A few detected names can't be used in a link ("tar.gz"), so keep the upload's
				ext: EXTENSION.test(detectedExt) ? detectedExt : ext,
				contentType: baseType(binary.mime),
			};
		}

		return { ok: false, reason: "mismatch" };
	}

	// Nothing recognisable in the bytes. That's expected for text formats (txt, svg,
	// csv, …), but a binary format file-type knows should have been recognised.
	if (isBinaryFormat(ext)) {
		return { ok: false, reason: "mismatch" };
	}

	return {
		ok: true,
		ext,
		contentType: ext === "txt" ? "text/plain" : OCTET_STREAM,
	};
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
