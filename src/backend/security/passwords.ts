import * as argon2 from "argon2";
import * as constants from "../Structures/constants/index";

enum PASSWORDS {
	MINIMUM_LENGTH = 8,
	MAX_LENGTH = 256,
	SALT_ROUNDS = 10,
}

const PASSWORD_REGEX = /^(?=.*\p{L})(?=.*[\p{M}\p{Z}\p{P}\p{S}]).{8,256}$/u;

export class PasswordError extends Error {
	readonly type: number;

	constructor(message: string, type: number) {
		super(`[PSW${type}] ${message}`);
		this.name = "PasswordError";
		this.type = type;
	}
}

export async function hashPass(password: string): Promise<string> {
	// If the password is too long
	if (password.length > PASSWORDS.MAX_LENGTH) {
		throw new PasswordError(
			constants.ENUMS.RESPONSES.PASSWORD.PASSWORD_LENGTH_EXCEED,
			2,
		);
	}

	const match = PASSWORD_REGEX.test(password);
	if (password.length < PASSWORDS.MINIMUM_LENGTH || !match) {
		throw new PasswordError(
			constants.ENUMS.RESPONSES.PASSWORD.PASSWORD_REQUIREMENTS,
			1,
		);
	}

	if (password.includes("\0")) {
		throw new PasswordError(constants.ENUMS.RESPONSES.PASSWORD.NO_NUL, 3);
	}

	return argon2.hash(password, { timeCost: PASSWORDS.SALT_ROUNDS });
}

export async function verifyPassword(
	hash: string,
	password: string,
): Promise<boolean> {
	return argon2.verify(hash, password);
}
