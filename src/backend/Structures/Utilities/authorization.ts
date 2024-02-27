/**
 * @license
 *
 * Folderr is an open source image host. https://github.com/Folderr
 * Copyright (C) 2020 Folderr
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

/**
 * @file Handles all token authorization in Folderr
 */

import crypto from "crypto";
import { Buffer } from "buffer";
import jwt, { type Algorithm } from "jsonwebtoken";
import type { Core } from "../../internals";
import { logger } from "../../internals";
import type { User } from "../Database/db-class";
import AuthKeyHandler from "../../handlers/auth-key-handler";

/**
 * @classdesc Handle token authorization.
 */
export default class Authorization {
	readonly #algorithms: Algorithm[];

	readonly #keyHandler: AuthKeyHandler;

	#privKey!: Buffer;

	#pubKey!: Buffer;

	readonly #core: Core;

	constructor(core: Core) {
		this.#keyHandler = new AuthKeyHandler();
		this.#core = core;
		this.#algorithms = [
			"RS256",
			"RS384",
			"RS512",
			"PS256",
			"PS384",
			"PS512",
		];
	}

	async init(): Promise<void> {
		try {
			await this.#keyHandler.fetchKeys(this.#core.db);
		} catch (error: unknown) {
			console.error((error as Error).message);
			const messages = [
				"Private and Public Keys Do Not Match.",
				"Unable to fetch keys",
				"You Need to Pass the Secret Key with an Environment Variable",
			];
			if (error instanceof Error && messages.includes(error.message)) {
				this.#core.logger.error(error.message);
				await this.#core.Utils.sleep(1000);
				this.#core.shutdownServer(
					"Utils.init",
					"Utility initialization failed"
				);
			}

			this.#core.app.sentry.captureException(error);
			return;
		}

		if (!this.#keyHandler.publicKey || !this.#keyHandler.privateKey) {
			throw new Error("The Key Handler could not find the keys!");
		}

		this.#pubKey = this.#keyHandler.publicKey;
		this.#privKey = this.#keyHandler.privateKey;
	}

	public async verify(token: string, web?: boolean): Promise<string | void> {
		if (web ?? token.startsWith("Bearer: ")) {
			token = token.slice(8);
		}

		try {
			const result = jwt.verify(token, this.#pubKey, {
				issuer: "folderr",
				algorithms: this.#algorithms,
			});
			if (!result || typeof result === "string" || !result.jti) {
				return;
			}

			const verify = await this.#core.db.findToken(
				result.jti,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				result.id,
				{
					web,
				}
			);
			if (!verify) {
				return;
			}

			return result.id as string;
		} catch (error: unknown) {
			this.#core.logger.error(error);
			if (
				error instanceof Error &&
				error.message !== "JsonWebTokenError: invalid signature"
			) {
				console.log(error);
			}
		}
	}

	public async verifyAccount(
		token?: string | string[],
		options?: {
			fn?: (args0: User) => boolean;
			web?: boolean;
		}
	): Promise<User | void> {
		if (!token) {
			return;
		}

		if (Array.isArray(token)) {
			return;
		}

		try {
			const id = await this.verify(token, options?.web);
			if (!id) {
				return;
			}

			const user = await this.#core.db.findUser({ id });
			if (!user) {
				this.#core.logger.debug(
					`User with ID ${id} failed authentication. Reason: not found`
				);
				return;
			}

			if (options?.fn && !options.fn(user)) {
				this.#core.logger.debug(
					`User with ID ${id} failed authentication. Reason: failed fn check`
				);
				return;
			}

			return user;
		} catch (error: unknown) {
			this.#core.logger.error(error);
		}
	}

	public async revoke(
		token: string,
		web?: boolean
	): Promise<boolean | void | 404> {
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
			});
			if (!result || typeof result === "string" || !result.jti) {
				return;
			}

			const verifyDb = await this.#core.db.purgeToken(
				result.jti,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				result.id,
				{
					web,
				}
			);
			if (!verifyDb) {
				return 404;
			}

			return true;
		} catch {}
	}

	public async revokeAll(
		userID: string,
		web?: boolean
	): Promise<boolean | void> {
		try {
			const del = await this.#core.db.purgeTokens(userID, web);
			if (!del || del === 0) {
				return;
			}

			this.#core.logger.info(`[DB] Deleted ${del} Authorization Tokens`);
			return true;
		} catch (error: unknown) {
			if (error instanceof Error) {
				logger.debug(
					`Authorization/Revoke All Error: ${error.message}`
				);
			} else if (typeof error === "string") {
				logger.debug(`Authorization/Revoke All Error: ${error}`);
			}
		}
	}

	async genKeyWeb(userID: string): Promise<string> {
		const id = this.genID();
		await this.#core.db.makeToken(id, userID, { web: true });
		return `Bearer: ${jwt.sign({ id: userID }, this.#privKey, {
			expiresIn: "14d",
			issuer: "folderr",
			jwtid: id,
			algorithm: "PS256",
		})}`;
	}

	async genKey(userID: string, description?: string): Promise<string> {
		const id = this.genID();
		await this.#core.db.makeToken(id, userID, { web: false, description });
		return jwt.sign({ id: userID }, this.#privKey, {
			issuer: "folderr",
			jwtid: id,
			algorithm: "PS256",
		});
	}

	async genMirrorKey(
		url: string,
		mirrorURL: string
	): Promise<{ key: string; id: string }> {
		const id = this.genID();
		return {
			key: jwt.sign(
				{
					url,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					mirrorURL,
				},
				this.#privKey,
				{
					issuer: "folderr",
					jwtid: id,
					expiresIn: "1h",
					algorithm: "PS256",
				}
			),
			id,
		};
	}

	verifyMirrorKey(
		message: {
			res: string;
			token: string;
		},
		id: string,
		url: string,
		mirrorURL: string
	): boolean {
		const out = jwt.verify(message.token, this.#privKey, {
			issuer: "folderr",
		});
		return Boolean(
			out &&
				typeof out === "object" &&
				out.jti === id &&
				out.url === url &&
				out.mirrorURL === mirrorURL &&
				message.res === "Mirror Operational"
		);
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	private genID(): string {
		return `${
			crypto.randomBytes(10).toString("hex") +
			Buffer.from(new Date().toString()).toString("base64").slice(0, 8)
		}`;
	}
}
