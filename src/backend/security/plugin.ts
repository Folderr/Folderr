// Fastify plugin

import fp from "fastify-plugin";
import type { Logger } from "pino";
import type { User } from "../Structures/Database/db-class";
import type { LoggerLevels } from "../Structures/logger";
import { loadKeys } from "./keys";
import Mirrors from "./mirrors";
import { dummyHash } from "./passwords";
import {
	logoutPolicy,
	requestUser,
	requireAdmin,
	requireOwner,
	requirePasswordConfirmation,
	requireSessionOrPassword,
	requireUser,
} from "./policies";
import AuthorizationTokens from "./tokens";

const policy = Object.freeze({
	requireUser,
	requireAdmin,
	requireOwner,
	requireSessionOrPassword,
	requirePasswordConfirmation,
	logoutPolicy,
});
type Policy = typeof policy;

declare module "fastify" {
	interface FastifyInstance {
		tokens: AuthorizationTokens;
		mirrors: Mirrors;
		requestUser: (request: FastifyRequest) => User;
		policy: Policy;
	}
	interface FastifyRequest {
		user: User | null;
	}
}

export default fp(
	async (fastify, _) => {
		const { db, log } = fastify;
		log.info("[SecureCore] - Bootstrapping SecureCore into Fastify");
		const keys = await loadKeys(db);
		const tokens = new AuthorizationTokens(
			db,
			log as Logger<LoggerLevels>,
			keys,
		);

		// Decorations
		fastify.decorate("requestUser", requestUser);
		fastify.decorate("tokens", tokens);
		fastify.decorate("mirrors", new Mirrors(keys));
		fastify.decorateRequest("user", null);

		// Checks
		fastify.decorate("policy", policy);

		await dummyHash(); // Pre-load the timing attack dummy
		log.info(
			"[SecureCore] - SecureCore successfully bootstrapped into Fastify",
		);
	},
	{
		name: "SecureCore",
		dependencies: ["@fastify/cookie"],
		decorators: { fastify: ["db"] },
	},
);
