import type { FastifyReply, FastifyRequest } from "fastify";
import type { User } from "../Structures/Database/db-class";
import codes from "../Structures/Utilities/status-codes.js";
import { invalidateLoginCookie } from "./cookies";
import type AuthorizationTokens from "./tokens";

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

type FastifyHookReturn = (
	request: FastifyRequest,
	reply: FastifyReply,
) => Promise<unknown>;

function requireRole(
	tokens: AuthorizationTokens,
	allowed: (user: User) => boolean,
): FastifyHookReturn {
	return async (request: FastifyRequest, reply: FastifyReply) => {
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

export function requireUser(tokens: AuthorizationTokens): FastifyHookReturn {
	return requireRole(tokens, () => true);
}

export function requireAdmin(tokens: AuthorizationTokens): FastifyHookReturn {
	return requireRole(tokens, (user) => (user.admin || user.owner) ?? false);
}

export function requireOwner(tokens: AuthorizationTokens): FastifyHookReturn {
	return requireRole(tokens, (user) => user.owner ?? false);
}
