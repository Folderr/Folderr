import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Core } from "../../../internals.js";
import type { NeoRoute } from "../../../Structures/neo-route.js";
import { routeType } from "../../../Structures/Utilities/upload-types.js";

const path = "/content/:type/:id";
const method = "DELETE";

type RouteTypes = {
	Params: {
		type: "file" | "link";
		id: string;
	};
};

type TakedownRequest = FastifyRequest<RouteTypes>;

type TakedownResult = {
	httpCode: 404 | 200;
	msg: {
		code: number;
		message: string;
	};
};

/**
 * @desc Emails the owner that their content was taken down, when the emailer is on.
 */
async function notifyOwner(
	core: Core,
	request: TakedownRequest,
	owner: string,
	id: string,
	type: string,
): Promise<void> {
	if (!core.emailer.active) {
		return;
	}

	const user = await core.db.findUser({ id: owner });
	if (!user) {
		return;
	}

	const url = await core.Utils.determineHomeURL(request);
	await core.emailer.takedown(
		{ email: user.email, username: user.username, id, type },
		url,
	);
}

async function takedownFile(
	core: Core,
	id: string,
	request: TakedownRequest,
): Promise<TakedownResult> {
	// Look the file up first; purgeFile only says whether it removed anything
	const del = await core.db.findFile({ id });
	// purgeFile removes the record and the file on disk
	if (!del || !(await core.db.purgeFile({ id }))) {
		return {
			httpCode: core.codes.notFound,
			msg: {
				code: core.Utils.foldCodes.dbNotFound,
				message: "File not found!",
			},
		};
	}

	await notifyOwner(core, request, del.owner, id, routeType(del.contentType));
	return {
		httpCode: core.codes.ok,
		msg: { code: core.codes.ok, message: "OK" },
	};
}

async function takedownLink(
	core: Core,
	id: string,
	request: TakedownRequest,
): Promise<TakedownResult> {
	const del = await core.db.findAndDeleteLink({ id });
	if (!del) {
		return {
			httpCode: core.codes.notFound,
			msg: {
				code: core.Utils.foldCodes.dbNotFound,
				message: "Link not found!",
			},
		};
	}

	await notifyOwner(core, request, del.owner, id, "Link");
	return {
		httpCode: core.codes.ok,
		msg: { code: core.codes.ok, message: "OK" },
	};
}

function route(fastify: FastifyInstance, core: Core) {
	fastify.route<RouteTypes>({
		method,
		url: path,
		schema: {
			tags: ["admin"],
			description:
				"Removes a file or a link, and emails its owner if the emailer is on",
			summary: "Take down content",
			security: [{ apiKey: [] }, { loginCookie: [] }],
			params: {
				type: "object",
				properties: {
					type: { type: "string" },
					id: { type: "string" },
				},
				required: ["type", "id"],
			},
			response: {
				"4xx": {
					examples: [
						{ code: 401, message: "Authorization failed." },
						{ code: 403, message: "Action forbidden" },
						{
							code: 400,
							message: "Missing or invalid requirements",
						},
						{ code: 1054, message: "File not found!" },
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
		preHandler: fastify.policy.requireAdmin,
		async handler(request: TakedownRequest, reply: FastifyReply) {
			if (
				!["file", "link"].includes(request.params.type) ||
				!/^[\dA-Za-z]+$/.test(request.params.id)
			) {
				return reply.status(core.codes.badReq).send({
					code: core.codes.badReq,
					message: "Missing or invalid requirements",
				});
			}

			const out =
				request.params.type === "file"
					? await takedownFile(core, request.params.id, request)
					: await takedownLink(core, request.params.id, request);
			return reply.status(out.httpCode).send(out.msg);
		},
	});
	fastify.log.info(`Initialized DELETE Admin Takedown at ${path}`);
}

export default {
	enabled: true,
	method,
	path,
	route,
} satisfies NeoRoute;
