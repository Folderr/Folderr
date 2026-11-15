import type { Buffer } from "buffer";
import jwt, { type Algorithm, JsonWebTokenError } from "jsonwebtoken";
import { ulid } from "ulidx";
import type { Core } from "../internals.js";
import { TOKEN_EXPIRY_DAYS } from "../Structures/constants/database.js";
import type { User } from "../Structures/Database/db-class.js";
import type { SigningKeys } from "./keys.js";

/**
 * @classdesc Handle token authorization for users.
 */
export default class AuthorizationTokens {
	readonly #algorithms: Algorithm[];

	readonly #privKey: Buffer;

	readonly #pubKey: Buffer;

	readonly #core: Core;

	constructor(core: Core, keys: SigningKeys) {
		this.#core = core;
		this.#algorithms = ["PS256"];
		this.#privKey = keys.privateKey;
		this.#pubKey = keys.publicKey;
	}

	public async verify(token: string, web?: boolean): Promise<string | null> {
		const isWeb = web ?? token.startsWith("Bearer: ");
		if (isWeb) {
			token = token.slice(8);
		}

		try {
			const result = jwt.verify(token, this.#pubKey, {
				issuer: "folderr",
				algorithms: this.#algorithms,
				audience: isWeb ? "web" : "api",
			});
			if (!result || typeof result === "string" || !result.jti) {
				return null;
			}

			const verify = await this.#core.db.findToken(
				result.jti,
				result.id,
				{
					web: isWeb,
				},
			);
			if (!verify) {
				return null;
			}

			return result.id as string;
		} catch (error: unknown) {
			this.#core.logger.error(error, "Token verification failed");
			throw error;
		}
	}

	public async verifyAccount(
		token?: string | string[], // Why do you accept an array?
		options?: {
			web?: boolean;
		},
	): Promise<User | undefined> {
		if (!token) {
			return undefined;
		}

		if (Array.isArray(token)) {
			return undefined;
		}

		try {
			const id = await this.verify(token, options?.web);
			if (!id) {
				return undefined;
			}

			const user = await this.#core.db.findUser({
				id,
				markedForDeletion: false,
			});
			if (!user) {
				this.#core.logger.debug(
					`User with ID ${id} failed authentication. Reason: not found or being deleted`,
				);
				return undefined;
			}

			return user;
		} catch (error: unknown) {
			if (error instanceof JsonWebTokenError) {
				return undefined;
			} else if (error instanceof Error) {
				this.#core.logger.error(error, "Account Verification Error");
			}
			throw error;
		}
	}

	public async revoke(
		token: string,
		web?: boolean,
	): Promise<boolean | null | 404> {
		if (token.startsWith("Bearer: ")) {
			web = true;
		}

		if (web) {
			token = token.slice(8);
		}

		try {
			const result = jwt.verify(token, this.#pubKey, {
				issuer: "folderr",
				algorithms: this.#algorithms,
				audience: /^web$|^api$/,
				ignoreExpiration: true,
			});
			if (!result || typeof result === "string" || !result.jti) {
				return null;
			}

			const verifyDb = await this.#core.db.purgeToken(
				result.jti,
				result.id,
				{
					web,
				},
			);
			if (!verifyDb) {
				return 404;
			}

			return true;
		} catch (error: unknown) {
			if (error instanceof JsonWebTokenError) {
				throw new Error("Invalid Token", { cause: error });
			}
			this.#core.logger.error(error, "Token revocation error");
			throw error;
		}
	}

	public async revokeAll(
		userID: string,
		web?: boolean,
	): Promise<boolean | null> {
		try {
			const del = await this.#core.db.purgeTokens(userID, web);
			this.#core.logger.info(`[DB] Deleted ${del} Authorization Tokens`);
			return true;
		} catch (error: unknown) {
			if (error instanceof Error) {
				this.#core.logger.error(
					error,
					"Authorization/Revoke All Error",
				);
			} else if (typeof error === "string") {
				this.#core.logger.error(
					error,
					"Authorization/Revoke All Error",
				);
			}
			return null; // Perhaps throw error
		}
	}

	async genKeyWeb(userID: string): Promise<string> {
		const id = ulid();
		await this.#core.db.makeToken(id, userID, { web: true });
		return `Bearer: ${jwt.sign({ id: userID }, this.#privKey, {
			expiresIn: `${TOKEN_EXPIRY_DAYS}d`,
			issuer: "folderr",
			jwtid: id,
			algorithm: this.#algorithms[0],
			audience: "web",
		})}`;
	}

	async genKey(userID: string, description?: string): Promise<string> {
		const id = ulid();
		await this.#core.db.makeToken(id, userID, { web: false, description });
		return jwt.sign({ id: userID }, this.#privKey, {
			issuer: "folderr",
			jwtid: id,
			algorithm: this.#algorithms[0],
			audience: "api",
		});
	}
}
