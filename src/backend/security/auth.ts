import type { FastifyReply, FastifyRequest } from "fastify";
import type Core from "../Structures/core.ts";
import type { User } from "../Structures/Database/db-class";
import { invalidateLoginCookie } from "./cookies.js";
import { verifyPassword } from "./passwords.js";

export async function checkAuth(
	core: Core,
	request: FastifyRequest,
	admin?: boolean,
	owner?: boolean,
	reply?: FastifyReply,
): Promise<{ code: 401 | 403 } | { code: 200; user: User }> {
	let account: User | null = null;
	try {
		if (request.headers.authorization) {
			account = await core.tokens.verifyAccount(
				request.headers.authorization,
				{
					fn: (user) => !user.markedForDeletion,
				},
			);
		} else if (request.cookies.token) {
			account = await core.tokens.verifyAccount(request.cookies.token, {
				web: true,
				fn: (user) => !user.markedForDeletion,
			});
		} else {
			return { code: 401 };
		}
	} catch (error: unknown) {
		// A malformed or expired token is a failed sign-in, not a server error
		if (!(error instanceof Error && error.message === "Invalid Token")) {
			throw error;
		}
	}

	if (!account) {
		// The login cookie is only used when there's no Authorization header
		if (!request.headers.authorization) {
			invalidateLoginCookie(request, reply);
		}

		return { code: 401 };
	}

	if (admin && !account.admin && !account.owner) {
		return { code: 403 };
	}

	if (owner && !account.owner) {
		return { code: 403 };
	}

	return { code: 200, user: account };
}

/**
 * @desc Authenticates with the website's login cookie or username/password headers, but never an API token,
 * so a leaked API token can't be used to see or remove other API tokens
 *
 * @param {Object<FastifyRequest>} request The request to authenticate
 * @param {Object<FastifyReply>} [reply] Pass the reply to clear the login cookie when it holds an invalid token
 * @returns {Object} Either code 200 and a user, or code 401 and no user
 */
export async function checkSessionOrPassword(
	core: Core,
	request: FastifyRequest,
	reply?: FastifyReply,
): Promise<{ code: 401 } | { code: 200; user: User }> {
	let account: User | null = null;
	if (request.cookies.token) {
		try {
			account = await core.tokens.verifyAccount(request.cookies.token, {
				web: true,
				fn: (user) => !user.markedForDeletion,
			});
		} catch (error: unknown) {
			if (
				!(error instanceof Error && error.message === "Invalid Token")
			) {
				throw error;
			}
		}

		if (!account) {
			invalidateLoginCookie(request, reply);
		}
	} else {
		account = await authPassword(core, request);
	}

	return account ? { code: 200, user: account } : { code: 401 };
}

async function authPassword(
	core: Core,
	request: FastifyRequest,
): Promise<User | null> {
	if (!request.headers.password || !request.headers.username) {
		// CHANGE TO BODY LATER
		if (process.env.NODE_ENV !== "production") {
			core.logger.debug("Failed to authenticate user, missing headers");
		}
		return null;
	}

	if (
		Array.isArray(request.headers.password) ||
		Array.isArray(request.headers.username)
	) {
		// Goes away with Zod schema & body
		return null;
	}

	const user = await core.db.findUser({
		username: request.headers.username,
		markedForDeletion: false, // Those who are gone may not sign in
	});

	if (!user) return null;

	const verify = await verifyPassword(
		user.password,
		request.headers.password,
	);
	if (!verify) return null;

	return user;
}
