import type { JTDSchemaType } from "ajv/dist/jtd.js";
import AJV from "ajv/dist/jtd.js";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Options, Response } from "got";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

type MirrorResponse = {
	message: {
		res: string;
		token: string;
	};
};

const msgschema: JTDSchemaType<MirrorResponse["message"]> = {
	properties: {
		res: { type: "string" },
		token: { type: "string" },
	},
};

const schema: JTDSchemaType<MirrorResponse> = {
	properties: {
		message: msgschema,
	},
};

const ajv = new AJV();
const parse = ajv.compileParser(schema);

const path = "/account/mirror";
const method = "POST";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Links a mirror (custom URL) to the signed-in user's account, after checking that the mirror answers Folderr's verification request",
			summary: "Add mirror",
			security: [{ apiKey: [] }],
			body: {
				type: "object",
				properties: {
					url: { type: "string" },
				},
				required: ["url"],
			},
			response: {
				"4xx": {
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				"5xx": {
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				200: {
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
			},
		},
		async handler(
			request: FastifyRequest<{
				Body: {
					url: string;
				};
			}>,
			reply: FastifyReply,
		) {
			const auth = await core.Utils.checkAuth(request);
			if (auth.code !== 200) {
				return reply.status(auth.code).send({
					code: auth.code,
					message: "Authorization failed.",
				});
			}

			let r: Response<MirrorResponse> | undefined;
			let id: string | undefined;
			let u: string | undefined;
			try {
				const url = new URL(request.body.url);
				if (
					!url.protocol ||
					!["http:", "https:"].includes(url.protocol)
				) {
					return reply.status(core.codes.badReq).send({
						code: core.Utils.foldCodes.mirrorInvalidUrl,
						message: "Invalid Mirror URL",
					});
				}

				if (core.Utils.isIPHost(request.body.url)) {
					return reply.status(core.codes.badReq).send({
						code: core.Utils.foldCodes.mirrorInvalidUrl,
						message: "Invalid Mirror URL",
					});
				}

				u = await core.Utils.determineHomeURL(request);
				const out = await core.Utils.authorization.genMirrorKey(
					u,
					request.body.url,
				);
				id = out.id;
				r = await core.got.post<MirrorResponse>(
					`${request.body.url}/api/verify`,
					{
						responseType: "json",
						parseJson: parse,
						json: {
							url: u,
							owner: auth.user.id,
							token: out.key,
						},
						lookup: core.Utils
							.noPrivateDnsLookup as unknown as Options["lookup"],
						maxRedirects: 1, // In case of HTTP to HTTPS upgrade
						hooks: {
							beforeRedirect: [
								(options) => {
									if (core.Utils.isIPHost(options.url.href)) {
										throw new Error("URL DISALLOWED");
									}
								},
							],
						},
					},
				);
			} catch (error: unknown) {
				if (
					error &&
					error instanceof Error &&
					error.message &&
					/Not Found|\[FAIL]|URL DISALLOWED|ENOTFOUND|EBLOCKED|Invalid URL/.test(
						error.message,
					)
				) {
					return reply.status(core.codes.notAccepted).send({
						code: core.Utils.foldCodes.mirrorReject,
						message: "Mirror failed Validation",
					});
				}

				return reply.status(core.codes.internalErr).send({
					code: core.Utils.foldCodes.unkownError,
					message: "Something unknown happened.",
				});
			}

			if (!r?.body) {
				return reply.status(core.codes.notAccepted).send({
					code: core.Utils.foldCodes.mirrorReject,
					message: "Mirror failed Validation",
				});
			}

			const { message } = r.body;
			const valid =
				id && u
					? core.Utils.authorization.verifyMirrorKey(
							message,
							id,
							u,
							request.body.url,
						)
					: false;
			if (!valid) {
				return reply.status(core.codes.notAccepted).send({
					code: core.Utils.foldCodes.mirrorReject,
					message: "Mirror failed Validation",
				});
			}

			await core.db.updateUser(
				{
					id: auth.user.id,
				},
				{
					$addToSet: {
						cURLs: request.body.url,
					},
				},
			);
			return reply
				.status(core.codes.ok)
				.send({ code: core.codes.ok, message: "OK" });
		},
	});
	fastify.log.info(`Initialized POST User Add Mirror at ${path}`);
}

// remove-mirror.ts rewrites the same path, so both legacy routes are replaced together
export default {
	enabled: true,
	method,
	path,
	rewrites: "/account/mirror",
	route,
} satisfies NeoRoute;
