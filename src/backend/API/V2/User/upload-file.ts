import { createWriteStream } from "node:fs";
import { rename } from "node:fs/promises";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { fileTypeFromFile } from "file-type";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";
import {
	MAX_UPLOAD_LABEL,
	readStart,
	removeUpload,
	routeType,
	uploadExtension,
	uploadName,
	uploadPath,
} from "../../../Structures/Utilities/upload-types.js";
import {
	checkUploadType,
	isExecutableExtension,
} from "../../../security/files.js";
import { testMirrorURL } from "../../../security/url-safety.js";

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
			security: [{ apiKey: [] }, { loginCookie: [] }],
			response: {
				"4xx": {
					examples: [
						{ code: 401, message: "Authorization failed." },
						{ code: 1001, message: "File not found!" },
						{ code: 1065, message: "Upload was aborted" },
						{
							code: 1004,
							message:
								"File is too large. The maximum size is 10 GB",
						},
						{ code: 1056, message: "Unsupported file extension" },
						{
							code: 1056,
							message: "Executable files aren't allowed",
						},
						{
							code: 1003,
							message:
								"The file's contents don't match its extension",
						},
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				500: {
					examples: [
						{ code: 1053, message: "The upload couldn't be saved" },
						{ code: 500, message: "An internal error occurred" },
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				200: {
					examples: ["https://folderr.example.com/i/aB3xK9q.png"],
					type: "string",
				},
			},
		},
		preHandler: fastify.policy.requireUser,
		async handler(request: FastifyRequest, reply: FastifyReply) {
			const auth = fastify.requestUser(request);

			const file = await request.file();

			if (!file?.file) {
				return reply.status(request.server.codes.badReq).send({
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
				return reply
					.status(request.server.codes.unprocessableContent)
					.send({
						code: core.Utils.foldCodes.securityError,
						message: "Unsupported file extension",
					});
			}

			if (isExecutableExtension(ext)) {
				file.file.resume();
				return reply
					.status(request.server.codes.unprocessableContent)
					.send({
						code: core.Utils.foldCodes.securityError,
						message: "Executable files aren't allowed",
					});
			}

			// Cleanup shouldn't fail. If it does, report it without hiding the real response
			const discard = (target: string) =>
				removeUpload(target).catch((error: unknown) => {
					request.server.reportError(error, request);
				});

			const id = await core.Utils.genShortId();
			const filePath = uploadPath(id, ext);

			try {
				await pump(file.file, createWriteStream(filePath));
			} catch (error: unknown) {
				await discard(filePath);
				if (
					error instanceof
					core.app.multipartErrors.RequestFileTooLargeError
				) {
					return reply
						.status(request.server.codes.contentTooLarge)
						.send({
							code: core.Utils.foldCodes.fileSizeLimit,
							message: `File is too large. The maximum size is ${MAX_UPLOAD_LABEL}`,
						});
				}

				// The client dropped the connection mid-upload. That isn't our failure
				if (request.raw.readableAborted) {
					return reply.status(request.server.codes.badReq).send({
						code: core.Utils.foldCodes.uploadAborted,
						message: "Upload was aborted",
					});
				}

				// The error handler logs, reports and answers it as a 500
				throw error;
			}

			if (file.file.truncated) {
				await discard(filePath);
				return reply.status(request.server.codes.contentTooLarge).send({
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
				await discard(filePath);
				return reply
					.status(request.server.codes.unprocessableContent)
					.send(
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
				await core.db.makeFile(id, auth.id, {
					contentType,
					ext: checked.ext,
				});
			} catch (error: unknown) {
				// Without a record the link would never work, so don't keep the file
				core.logger.error(error);
				await discard(storedPath);
				return reply.status(request.server.codes.internalErr).send({
					code: core.Utils.foldCodes.dbUnkownError,
					message: "The upload couldn't be saved",
				});
			}

			const responseURL = request.headers.responseurl;
			const base =
				typeof responseURL === "string" &&
				auth.cURLs.includes(responseURL) &&
				(await testMirrorURL(fastify.got, responseURL))
					? responseURL
					: await core.Utils.determineHomeURL(request);
			return reply
				.status(request.server.codes.ok)
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
