import type { CookieSerializeOptions } from "@fastify/cookie";
import type { FastifyReply, FastifyRequest } from "fastify";
import process from "process";

/**
 * @desc The options for the website's login cookie. Setting and clearing it must use the same ones.
 * Secure follows the request's own protocol, so plain-HTTP homelab and local installs still work
 * (behind a proxy this needs trustProxies, so the forwarded protocol is used).
 *
 * @param {Object<FastifyRequest>} request The request the cookie is being set or cleared on
 * @returns {CookieSerializeOptions}
 */
export function tokenCookieOptions(
	request: FastifyRequest,
): CookieSerializeOptions {
	const dev = process.env.NODE_ENV === "dev";
	return {
		httpOnly: true,
		secure: !dev && request.protocol === "https",
		sameSite: dev ? undefined : "strict",
	};
}

// This function produces a side effect and that is its sole job
export function invalidateLoginCookie(
	request: FastifyRequest,
	reply?: FastifyReply,
): void {
	if (!reply || !request.cookies.token) {
		return;
	}

	reply
		.header("Authorization-Status", "Invalidated")
		.clearCookie("token", tokenCookieOptions(request));
}
