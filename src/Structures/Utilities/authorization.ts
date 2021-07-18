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

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Core from '../core';
import {User} from '../Database/db-class';
import AuthKeyHandler from '../../handlers/auth-key-handler';

/**
 * @classdesc Handle token authorization.
 */
export default class Authorization {
	#keyHandler: AuthKeyHandler;

	#privKey!: Buffer;

	#pubKey!: Buffer;

	#core: Core;

	constructor(core: Core) {
		this.#keyHandler = new AuthKeyHandler();
		this.#core = core;
	}

	async init(): Promise<void> {
		await this.#keyHandler.fetchKeys(this.#core.db);
		if (!this.#keyHandler.publicKey || !this.#keyHandler.privateKey) {
			throw new Error('The Key Handler could not find the keys!');
		}

		this.#pubKey = this.#keyHandler.publicKey;
		this.#privKey = this.#keyHandler.privateKey;
	}

	public async verify(token: string, web?: boolean): Promise<string | void> {
		if (web) {
			token = token.slice(8);
		}

		try {
			const result = jwt.verify(token, this.#pubKey, {issuer: 'folderr'});
			if (!result || typeof result === 'string' || !result.jti) {
				return;
			}

			const verify = await this.#core.db.findToken(result.jti, result.id, {
				web
			});
			if (!verify) {
				return;
			}

			return result.id as string;
		} catch {}
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

			const user = await this.#core.db.findUser({id});
			if (!user) {
				return;
			}

			if (options?.fn && !options.fn(user)) {
				return;
			}

			return user;
		} catch {}
	}

	public async revoke(token: string, web?: boolean): Promise<boolean | void> {
		if (web) {
			token = token.slice(8);
		}

		try {
			const result = jwt.verify(token, this.#pubKey, {issuer: 'folderr'});
			if (!result || typeof result === 'string' || !result.jti) {
				return;
			}

			const verifyDB = await this.#core.db.purgeToken(result.jti, result.id, {
				web
			});
			if (!verifyDB) {
				return;
			}

			return true;
		} catch {}
	}

	public async revokeAll(userID: string): Promise<boolean | void> {
		try {
			const del = await this.#core.db.purgeTokens(userID);
			if (!del || del === 0) {
				return;
			}

			this.#core.logger.verbose(`[DB] Deleted ${del} Authorization Tokens`);
			return true;
		} catch {}
	}

	async genKeyWeb(userID: string): Promise<string> {
		const id = this.genID();
		await this.#core.db.makeToken(id, userID, {web: true});
		return `Bearer: ${jwt.sign({id: userID}, this.#privKey, {
			expiresIn: '14d',
			issuer: 'folderr',
			jwtid: id
		})}`;
	}

	async genKey(userID: string): Promise<string> {
		const id = this.genID();
		await this.#core.db.makeToken(id, userID, {web: false});
		return jwt.sign({id: userID}, this.#privKey, {
			issuer: 'folderr',
			jwtid: id
		});
	}

	async genMirrorKey(
		url: string,
		mirrorURL: string
	): Promise<{key: string; id: string}> {
		const id = this.genID();
		return {
			key: jwt.sign(
				{
					url,
					mirrorURL
				},
				this.#privKey,
				{
					issuer: 'folderr',
					jwtid: id,
					expiresIn: '1h'
				}
			),
			id
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
			issuer: 'folderr'
		});
		if (
			out &&
			typeof out === 'object' &&
			out.jti === id &&
			out.url === url &&
			out.mirrorURL === mirrorURL &&
			message.res === 'Mirror Operational'
		) {
			return true;
		}

		return false;
	}

	private genID(): string {
		return `${
			crypto.randomBytes(10).toString('hex') +
			Buffer.from(new Date().toString()).toString('base64').slice(0, 8)
		}`;
	}
}
