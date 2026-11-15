import type {
	FastifyReply,
	FastifyRequest,
	preHandlerAsyncHookHandler,
} from "fastify";
import jwt from "jsonwebtoken";
import type { User } from "../Structures/Database/db-class";
import codes from "../Structures/Utilities/status-codes.js";
import { authPassword } from "./auth";
import { invalidateLoginCookie } from "./cookies";
import type AuthorizationTokens from "./tokens";

const { JsonWebTokenError } = jwt;

async function grabUser(
	tokens: AuthorizationTokens,
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<
	| {
			code: 401;
	  }
	| {
			code: 200;
			user: User;
	  }
> {
	let account: User | undefined;
	if (request.headers.authorization) {
		account = await tokens.verifyAccount(request.headers.authorization, {
			web: false,
		});
	} else if (request.cookies.token) {
		account = await tokens.verifyAccount(request.cookies.token, {
			web: true,
		});
	} else {
		return { code: 401 };
	}

	if (!account) {
		if (!request.headers.authorization) {
			invalidateLoginCookie(request, reply);
		}

		return { code: 401 };
	}

	return { code: 200, user: account };
}

function requireRole(
	allowed: (user: User) => boolean,
): preHandlerAsyncHookHandler {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		const { tokens } = request.server;
		const check = await grabUser(tokens, request, reply);
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

export async function requireSessionOrPassword(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<unknown> {
	const { db, tokens } = request.server;
	let account: User | undefined;
	if (request.cookies.token) {
		try {
			account = await tokens.verifyAccount(request.cookies.token, {
				web: true,
			});
		} catch (error: unknown) {
			if (!(error instanceof JsonWebTokenError)) {
				throw error;
			}

			// Treat as an invalid key
			return reply
				.status(codes.unauth)
				.send({ code: codes.unauth, message: "Authorization failed." });
		}

		if (!account) {
			invalidateLoginCookie(request, reply);
		}
	} else {
		account = await authPassword(db, request.log, request);
	}

	if (!account) {
		return reply
			.status(codes.unauth)
			.send({ code: codes.unauth, message: "Authorization failed." });
	}
	request.setDecorator("user", account);
}
