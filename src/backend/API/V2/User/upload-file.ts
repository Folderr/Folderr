import { createWriteStream } from "node:fs";
import { rename, unlink } from "node:fs/promises";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { fileTypeFromFile } from "file-type";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";
import {
	checkUploadType,
	isExecutableExtension,
	MAX_UPLOAD_LABEL,
	readStart,
	routeType,
	uploadExtension,
	uploadName,
	uploadPath,
} from "../../../Structures/Utilities/upload-types.js";

const pump = promisify(pipeline);

const path = "/file";
const method = "POST";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Uploads a file (multipart) and returns its link. Executables, and files whose contents don't match their extension, are refused",
			summary: "Upload file",
			security: [{ apiKey: [] }],
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
		async handler(request: FastifyRequest, reply: FastifyReply) {
			const auth = await core.Utils.checkAuth(request);
			if (auth.code !== 200) {
				return reply.status(auth.code).send({
					code: auth.code,
					message: "Authorization failed.",
				});
			}

			const file = await request.file();

			if (!file?.file) {
				return reply.status(core.codes.badReq).send({
					code: core.Utils.foldCodes.noFile,
					message: "File not found!",
				});
			}

			// The name comes from the upload's headers, so these checks run before any
			// of the file is read. Draining it lets the request finish.
			const ext = uploadExtension(file.filename);
			// "" means no extension, which is fine; undefined means an unusable one
			if (ext === undefined) {
				file.file.resume();
				return reply.status(core.codes.badReq).send({
					code: core.Utils.foldCodes.securityError,
					message: "Unsupported file extension",
				});
			}

			if (isExecutableExtension(ext)) {
				file.file.resume();
				return reply.status(core.codes.badReq).send({
					code: core.Utils.foldCodes.securityError,
					message: "Executable files aren't allowed",
				});
			}

			const id = await core.Utils.genShortId();
			const filePath = uploadPath(id, ext);

			try {
				await pump(file.file, createWriteStream(filePath));
			} catch (error: unknown) {
				await unlink(filePath).catch(() => undefined);
				if (
					error instanceof
					core.app.multipartErrors.RequestFileTooLargeError
				) {
					return reply.status(core.codes.badReq).send({
						code: core.Utils.foldCodes.fileSizeLimit,
						message: `File is too large. The maximum size is ${MAX_UPLOAD_LABEL}`,
					});
				}

				core.logger.error(error);

				return reply.status(core.codes.internalErr).send({
					code: core.Utils.foldCodes.fileParserError,
					message: "File failed to be parsed!",
				});
			}

			if (file.file.truncated) {
				await unlink(filePath);
				return reply.status(core.codes.badReq).send({
					code: core.Utils.foldCodes.fileSizeLimit,
					message: `File is too large. The maximum size is ${MAX_UPLOAD_LABEL}`,
				});
			}

			// Check what the saved file really is from its first bytes
			const detected = await fileTypeFromFile(filePath).catch(
				() => undefined,
			);
			const checked = checkUploadType(
				ext,
				await readStart(filePath, 2),
				detected,
			);
			if (!checked.ok) {
				await unlink(filePath);
				return reply.status(core.codes.badReq).send(
					checked.reason === "executable"
						? {
								code: core.Utils.foldCodes.securityError,
								message: "Executable files aren't allowed",
							}
						: {
								code: core.Utils.foldCodes.fileMimeError,
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
					core.db.makeFile(id, auth.user.id, {
						contentType,
						ext: checked.ext,
					}),
					core.db.updateUser(
						{ id: auth.user.id },
						{ $inc: { files: 1 } },
					),
				]);
			} catch (error: unknown) {
				// Without a record the link would never work, so don't keep the file
				core.logger.error(error);
				await unlink(storedPath).catch(() => undefined);
				return reply.status(core.codes.internalErr).send({
					code: core.Utils.foldCodes.dbUnkownError,
					message: "The upload couldn't be saved",
				});
			}

			const responseURL = request.headers.responseurl;
			const base =
				typeof responseURL === "string" &&
				auth.user.cURLs.includes(responseURL) &&
				(await core.Utils.testMirrorURL(responseURL))
					? responseURL
					: await core.Utils.determineHomeURL(request);
			return reply
				.status(core.codes.ok)
				.send(`${base}/${type[0]}/${uploadName(id, checked.ext)}`);
		},
	});
	fastify.log.info(`Initialized POST User Upload at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
