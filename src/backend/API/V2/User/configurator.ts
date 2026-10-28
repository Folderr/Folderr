import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";
import Configurator from "../../../Structures/Utilities/sharex-configurator.js";

const path = "/sharex/config";
const method = "POST";

function route(fastify: FastifyInstance, core: Core) {
	const configurator = new Configurator();
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Builds ShareX upload configs for an API token. Pass d=file or d=link to download one as a .sxcu file",
			summary: "ShareX config",
			security: [{ apiKey: [] }],
			body: {
				type: "object",
				properties: {
					token: { type: "string" },
				},
				required: ["token"],
			},
			querystring: {
				type: "object",
				properties: {
					d: { type: "string" },
				},
			},
		},
		async handler(
			request: FastifyRequest<{
				Body: {
					token: string;
				};
				Querystring: {
					d?: string;
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

			let compare: Awaited<
				ReturnType<typeof core.Utils.authorization.verifyAccount>
			>;
			try {
				compare = await core.Utils.authorization.verifyAccount(
					request.body.token,
				);
			} catch {
				compare = undefined;
			}

			if (!compare) {
				return reply.status(core.codes.unauth).send({
					code: core.codes.notAccepted,
					message: "Invalid Token!",
				});
			}

			const url = await core.Utils.determineHomeURL(request);
			const config = configurator.generateFiles(url, request.body.token);
			const download =
				request.query?.d === "file"
					? config[0]
					: request.query?.d === "link"
						? config[1]
						: undefined;
			if (download) {
				return reply
					.type("text/plain; charset=binary")
					.header(
						"Content-Disposition",
						"attachment; filename=Folderr-Link-Config.sxcu",
					)
					.status(core.codes.ok)
					.send(download);
			}

			return reply
				.status(core.codes.ok)
				.send({ code: core.codes.ok, message: config });
		},
	});
	fastify.log.info(`Initialized POST ShareX Configurator at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
