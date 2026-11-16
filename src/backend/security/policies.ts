import type {
	FastifyReply,
	FastifyRequest,
	preHandlerAsyncHookHandler,
} from "fastify";
import type { User } from "../Structures/Database/db-class";
import codes from "../Structures/Utilities/status-codes.js";
import { authPassword } from "./auth";
import { invalidateLoginCookie } from "./cookies";
import { verifyPassword } from "./passwords";
import type AuthorizationTokens from "./tokens";

async function grabUser(
	tokens: AuthorizationTokens,
	request: FastifyRequest,
	reply: FastifyReply,
	options: {
		apiAllowed: boolean;
		passwordAllowed: boolean;
	},
): Promise<
	| {
			code: 401;
	  }
	| {
			code: 200;
			user: User;
	  }
> {
	let user: User | undefined;
	if (options.apiAllowed && request.headers.authorization) {
		user = await tokens.verifyAccount(request.headers.authorization, {
			web: false,
		});
	} else if (request.cookies.token) {
		user = await tokens.verifyAccount(request.cookies.token, {
			web: true,
		});
		if (!user) {
			invalidateLoginCookie(request, reply);
		}
	} else if (
		options.passwordAllowed &&
		request.headers.username &&
		request.headers.password
	) {
		user = await authPassword(
			request.server.db,
			request.server.log,
			request,
		);
	} else {
		return { code: 401 };
	}

	if (!user) return { code: 401 };

	return { code: 200, user };
}

function requireRole(
	allowed: (user: User) => boolean,
): preHandlerAsyncHookHandler {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		const { tokens } = request.server;
		const check = await grabUser(tokens, request, reply, {
			apiAllowed: true,
			passwordAllowed: false,
		});
		if (check.code !== 200) {
			return reply
				.status(codes.unauth)
				.send({ code: codes.unauth, message: "Authorization failed." });
		}
		if (!allowed(check.user)) {
			return reply
				.status(codes.forbidden)
				.send({ code: codes.forbidden, message: "Action forbidden" });
		}
		request.setDecorator("user", check.user);
	};
}

// The actual policies as Fastify hook handlers
export function requestUser(request: FastifyRequest): User {
	if (!request.user) {
		throw new Error(
			`${request.routeOptions.url} has no user and requires one`,
		);
	}
	return request.user;
}

export const requireUser = requireRole(() => true);
export const requireAdmin = requireRole(
	(user) => (user.admin || user.owner) ?? false,
);
export const requireOwner = requireRole((user) => user.owner ?? false);

// Passwords
export async function logoutPolicy(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<unknown> {
	const check = await grabUser(request.server.tokens, request, reply, {
		apiAllowed: false,
		passwordAllowed: true,
	});
	if (check.code !== 200) {
		return reply.status(request.server.codes.ok).send({
			code: request.server.codes.ok,
			message: "Logged out",
		});
	}

	request.setDecorator("user", check.user);
}

export async function requireSessionOrPassword(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<unknown> {
	const check = await grabUser(request.server.tokens, request, reply, {
		apiAllowed: false,
		passwordAllowed: true,
	});
	if (check.code !== 200) {
		return reply
			.status(request.server.codes.unauth)
			.send({
				code: request.server.codes.unauth,
				message: "Authorization failed.",
			});
	}
	request.setDecorator("user", check.user);
}

export function requirePasswordConfirmation<Body = unknown>(
	when: (body: Body) => boolean = () => true,
	message?: string,
): preHandlerAsyncHookHandler {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		if (!when(request.body as Body)) return;
		const user = request.server.requestUser(request);
		const current = (request.body as { currentPassword?: true } | undefined)
			?.currentPassword;
		if (typeof current !== "string")
			return reply.status(request.server.codes.badReq).send({
				code: request.server.codes.badReq,
				message: message ?? "This change needs your password",
			});
		if (!(await verifyPassword(user.password, current)))
			return reply.status(request.server.codes.unauth).send({
				code: request.server.codes.unauth,
				message: "Authorization failed.",
			});
		return;
	};
}
