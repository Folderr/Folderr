import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { Tokendb } from "../../../Structures/Database/db-class.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/account/token";
const method = "POST";

// How many API tokens a user can have before they must delete one or override
const TOKEN_LIMIT = 10;

type TokenRequest = {
	Querystring: {
		override?: boolean;
	};
	Body: {
		description?: string;
	};
};

function route(fastify: FastifyInstance, core: Core) {
	fastify.route<TokenRequest>({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description: `Creates an API token for the signed-in user. Users can have ${TOKEN_LIMIT}; pass override=true to replace the oldest`,
			summary: "Create API token",
			security: [{ apiKey: [] }, { loginCookie: [] }],
			body: {
				type: "object",
				properties: {
					description: { type: "string", maxLength: 50 },
				},
			},
			querystring: {
				type: "object",
				properties: {
					override: { type: "boolean" },
				},
			},
			response: {
				"4xx": {
					examples: [
						{ code: 401, message: "Authorization failed." },
						{
							code: 1037,
							message:
								'You have maxed out your tokens! Either delete one or re-request with "?override=true" at the end of the url (This will delete the first one created).',
						},
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				201: {
					examples: [
						{
							code: 200,
							message: "eyJhbGciOiJIUzI1NiJ9.example.signature",
						},
					],
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
			},
		},
		// The body is optional; treat a missing one as empty so the schema still applies
		async preValidation(request: FastifyRequest<TokenRequest>) {
			request.body ??= {};
		},
		async handler(
			request: FastifyRequest<TokenRequest>,
			reply: FastifyReply,
		) {
			const auth = await core.Utils.checkAuth(request);
			if (auth.code !== 200) {
				return reply.status(auth.code).send({
					code: auth.code,
					message: "Authorization failed.",
				});
			}

			const tokens = await core.db.findTokens(auth.user.id, {
				web: false,
			});
			if (tokens.length >= TOKEN_LIMIT && !request.query.override) {
				return reply.status(core.codes.forbidden).send({
					code: core.Utils.foldCodes.tokenSizeLimit,
					message:
						'You have maxed out your tokens! Either delete one or re-request with "?override=true" at the end of the url (This will delete the first one created).',
				});
			}

			if (tokens.length >= TOKEN_LIMIT && request.query.override) {
				const oldest = tokens.sort(
					(a: Tokendb, b: Tokendb) =>
						Number(a.createdAt) - Number(b.createdAt),
				)[0];
				await core.db.purgeToken(oldest.id, oldest.userID, {
					web: false,
				});
			}

			const token = await core.Utils.authorization.genKey(
				auth.user.id,
				request.body?.description,
			);
			return reply
				.status(core.codes.created)
				.send({ code: core.codes.ok, message: token });
		},
	});
	fastify.log.info(`Initialized POST User Generate Token at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
