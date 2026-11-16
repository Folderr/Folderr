import type { FastifyBaseLogger, FastifyRequest } from "fastify";
import type { DBClass, User } from "../Structures/Database/db-class";
import { dummyHash, verifyPassword } from "./passwords.js";

export async function authPassword(
	db: DBClass,
	logger: FastifyBaseLogger,
	request: FastifyRequest,
): Promise<User | undefined> {
	if (!request.headers.password || !request.headers.username) {
		// CHANGE TO BODY LATER
		if (process.env.NODE_ENV !== "production") {
			logger.debug("Failed to authenticate user, missing headers");
		}
		return undefined;
	}

	if (
		Array.isArray(request.headers.password) ||
		Array.isArray(request.headers.username)
	) {
		// Goes away with Zod schema & body
		return undefined;
	}

	const user = await db.findUser({
		username: request.headers.username,
		markedForDeletion: false, // Those who are gone may not sign in
	});

	// Deters a user leak from a timing attack in the event the user does or doesn't exist
	const dummy = await dummyHash();
	const verify = await verifyPassword(
		user?.password ?? dummy,
		request.headers.password,
	);
	if (!verify || !user) return undefined;

	return user;
}
