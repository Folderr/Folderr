import type { JTDSchemaType } from "ajv/dist/jtd.js";
import AJV from "ajv/dist/jtd.js";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Options, Response } from "got";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";
import { isIPHost, noPrivateDnsLookup } from "../../../security/url-safety.js";

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

type RouteTypes = {
	Body: {
		url: string;
	};
};

function route(fastify: FastifyInstance, core: Core) {
	fastify.route<RouteTypes>({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Links a mirror (custom URL) to the signed-in user's account, after checking that the mirror answers Folderr's verification request",
			summary: "Add mirror",
			security: [{ username: [], password: [] }, { loginCookie: [] }],
			body: {
				type: "object",
				properties: {
					url: { type: "string" },
				},
				required: ["url"],
			},
			response: {
				"4xx": {
					examples: [
						{ code: 401, message: "Authorization failed." },
						{
							code: 400,
							message: "body must have required property 'url'",
						},
						{
							code: 1064,
							message: "Mirror domain is already in use",
						},
						{ code: 1050, message: "Invalid Mirror URL" },
						{ code: 1049, message: "Mirror failed Validation" },
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				"5xx": {
					examples: [
						{ code: 1052, message: "Something unknown happened." },
						{ code: 500, message: "An internal error occurred" },
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				200: {
					examples: [{ code: 200, message: "OK" }],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
			},
		},
		preHandler: fastify.policy.requireSessionOrPassword,
		async handler(
			request: FastifyRequest<RouteTypes>,
			reply: FastifyReply,
		) {
			const auth = fastify.requestUser(request);

			let r: Response<MirrorResponse> | undefined;
			let id: string | undefined;
			let u: string | undefined;
			try {
				const url = new URL(request.body.url);
				if (
					!url.protocol ||
					!["http:", "https:"].includes(url.protocol)
				) {
					return reply.status(request.server.codes.badReq).send({
						code: core.Utils.foldCodes.mirrorInvalidUrl,
						message: "Invalid Mirror URL",
					});
				}

				if (isIPHost(request.body.url)) {
					return reply.status(request.server.codes.badReq).send({
						code: core.Utils.foldCodes.mirrorInvalidUrl,
						message: "Invalid Mirror URL",
					});
				}

				u = await core.Utils.determineHomeURL(request);
				const out = await fastify.mirrors.genMirrorKey(
					u,
					request.body.url,
				);
				id = out.id;
				r = await fastify.got.post<MirrorResponse>(
					`${request.body.url}/api/verify`,
					{
						responseType: "json",
						parseJson: parse,
						json: {
							url: u,
							owner: auth.id,
							token: out.key,
						},
						lookup: noPrivateDnsLookup as unknown as Options["lookup"],
						maxRedirects: 1, // In case of HTTP to HTTPS upgrade
						hooks: {
							beforeRedirect: [
								(options) => {
									if (isIPHost(options.url.href)) {
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
					return reply.status(request.server.codes.notAccepted).send({
						code: core.Utils.foldCodes.mirrorReject,
						message: "Mirror failed Validation",
					});
				}

				return reply.status(request.server.codes.internalErr).send({
					code: core.Utils.foldCodes.unkownError,
					message: "Something unknown happened.",
				});
			}

			if (!r?.body) {
				return reply.status(request.server.codes.notAccepted).send({
					code: core.Utils.foldCodes.mirrorReject,
					message: "Mirror failed Validation",
				});
			}

			// Schema validated by AJV
			const { message } = r.body;
			const valid =
				id && u
					? fastify.mirrors.verifyMirrorKey(
							message,
							id,
							u,
							request.body.url,
						)
					: false;
			if (!valid) {
				return reply.status(request.server.codes.notAccepted).send({
					code: core.Utils.foldCodes.mirrorReject,
					message: "Mirror failed Validation",
				});
			}

			const result = await core.db.addMirror(auth.id, request.body.url);
			if (!result) {
				return reply.status(request.server.codes.conflict).send({
					code: request.server.utils.foldCodes.mirrorTaken,
					message: "Mirror domain is already in use",
				});
			}
			return reply
				.status(request.server.codes.ok)
				.send({ code: request.server.codes.ok, message: "OK" });
		},
	});
	fastify.log.info(`Initialized POST User Add Mirror at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
