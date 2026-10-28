import childProcess from "node:child_process";
import util from "node:util";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import Package from "../../../../../package.json" with { type: "json" };
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";

const exec = util.promisify(childProcess.exec);

const path = "/info";
const method = "GET";

/**
 * @desc Runs a git command, or returns undefined where git isn't available (e.g. a Docker image).
 */
async function git(command: string): Promise<string | undefined> {
	try {
		const { stdout } = await exec(`git ${command}`);
		return stdout.trim();
	} catch {
		return undefined;
	}
}

function route(fastify: FastifyInstance, core: Core) {
	fastify.route({
		method,
		url: path,
		schema: {
			tags: ["admin"],
			description:
				"Shows the running version, and the git branch and commit when Folderr runs from a git checkout",
			summary: "Server version",
			security: [{ apiKey: [] }],
			response: {
				"4xx": {
					type: "object",
					properties: {
						message: { type: "string" },
						code: { type: "number" },
					},
				},
				200: {
					type: "object",
					properties: {
						message: {
							type: "object",
							properties: {
								version: { type: "string" },
								branch: { type: ["string", "null"] },
								commit: { type: ["string", "null"] },
							},
						},
						code: { type: "number" },
					},
				},
			},
		},
		async handler(request: FastifyRequest, reply: FastifyReply) {
			const auth = await core.Utils.checkAuth(request, true);
			if (auth.code !== 200) {
				return reply.status(auth.code).send({
					code: auth.code,
					message: "Authorization failed.",
				});
			}

			const [branch, commit] = await Promise.all([
				git("rev-parse --abbrev-ref HEAD"),
				git("log -1 --oneline"),
			]);
			return reply.status(core.codes.ok).send({
				code: core.codes.ok,
				message: {
					version: Package.version,
					branch: branch ?? null,
					commit: commit ?? null,
				},
			});
		},
	});
	fastify.log.info(`Initialized GET Server Info at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
