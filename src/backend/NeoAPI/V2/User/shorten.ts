import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Options } from "got";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const path = "/link";
const method = "POST";

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["user"],
			description:
				"Shortens a public http or https URL and returns the short link. Private, local and IP-address URLs are refused",
			summary: "Shorten link",
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
				200: {
					type: "string",
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

			// Every way this can fail gets the same response, so it can't be used to
			// probe which hosts exist or are reachable from this server
			let url: URL;
			try {
				url = new URL(request.body.url);
				if (
					!["http:", "https:"].includes(url.protocol) ||
					core.Utils.isIPHost(url.href)
				) {
					throw new Error("URL DISALLOWED");
				}

				await core.got.head(url.href, {
					timeout: 3000,
					retry: 0,
					maxRedirects: 1,
					// Rejects names that resolve to private addresses. IP literals never
					// reach a lookup, so those are checked above and on every redirect.
					// got types this as an overloaded function, but Node only ever calls
					// the (hostname, options, callback) form that this implements
					lookup: core.Utils
						.noPrivateDnsLookup as unknown as Options["lookup"],
					hooks: {
						beforeRedirect: [
							(options) => {
								if (core.Utils.isIPHost(options.url.href)) {
									throw new Error("URL DISALLOWED");
								}
							},
						],
					},
				});
			} catch (error: unknown) {
				if (error instanceof Error) {
					core.logger.debug(
						`Shorten rejected a URL: ${error.message}`,
					);
				}

				return reply.status(core.codes.notFound).send({
					code: core.Utils.foldCodes.shortUrlNotFound,
					message: "URL not found!",
				});
			}

			const ID = await core.Utils.genShortId();
			await Promise.all([
				core.db.makeLink(ID, auth.user.id, url.toString()),
				core.db.updateUser(
					{ id: auth.user.id },
					{ $inc: { links: 1 } },
				),
			]);

			const responseURL = request.headers.responseURL;
			const base =
				typeof responseURL === "string" &&
				auth.user.cURLs.includes(responseURL) &&
				(await core.Utils.testMirrorURL(responseURL))
					? responseURL
					: await core.Utils.determineHomeURL(request);
			return reply.status(core.codes.ok).send(`${base}/l/${ID}`);
		},
	});
	fastify.log.info(`Initialized POST User Shorten at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	rewrites: "/link",
	route,
} satisfies NeoRoute;
