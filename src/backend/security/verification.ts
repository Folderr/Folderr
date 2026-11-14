import * as argon2 from "argon2";
import crypto from "crypto";
import type DBClass from "../Structures/Database/db-class.js";
import type { PendingMember } from "../Structures/Database/db-class.js";
import { PASSWORDS, verifyPassword } from "./passwords";

type TokenReturn = {
	token: string;
	hash: string;
};

enum TOKENS {
	BYTES = 48,
}

/**
 * @desc Generate a validation token
 * @async
 *
 * @returns {Promise<{hash: string, token: string}>}
 */
export async function genValidationToken(): Promise<TokenReturn> {
	const random = crypto.randomBytes(TOKENS.BYTES).toString("base64url");
	const hash = await argon2.hash(random, { timeCost: PASSWORDS.SALT_ROUNDS });
	return { token: random, hash };
}

export async function findVerifying(
	db: DBClass,
	validationToken: string,
	userId: string,
): Promise<PendingMember | null> {
	const user = await db.findVerify(userId);
	if (!user) return null;
	if (!(await argon2.verify(user.validationToken, validationToken)))
		return null;

	return user;
}
