import { supportedExtensions } from "file-type";

export const OCTET_STREAM = "application/octet-stream";

export const EXTENSION = /^[a-z0-9]{1,10}$/;

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
