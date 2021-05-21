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
 * @file Handles all token authorization in Folderr-X
 */

import jwt from 'jsonwebtoken';
import fs from 'fs';
import crypto from 'crypto';
import Core from '../core';
import {User} from '../Database/db-class';

interface Keys {
	privKeyPath: string;
	algorithm?: string;
	pubKeyPath: string;
}

/**
 * @classdesc Handle token authorization.
 */
export default class Authorization { /* eslint-disable @typescript-eslint/indent */
    #secret: Keys;

    #privKey!: Buffer;

    #pubKey!: Buffer;

    #core: Core;

    constructor(secret: Keys, core: Core) {
		this.#secret = secret;
		if (!this.#secret.algorithm) {
			this.#secret.algorithm = 'RS256';
		}

		this.#pubKey = fs.readFileSync(this.#secret.pubKeyPath);
		this.#privKey = fs.readFileSync(this.#secret.privKeyPath);
		this.#core = core;
    }

    public async verify(token: string, web?: boolean): Promise<string | void> {
		if (web) {
			token = token.slice(8);
		}

		try {
			const result: any = jwt.verify(token, this.#pubKey, {issuer: 'folderr'});
			if (!result) {
				return;
			}

			const verify = await this.#core.db.findToken(result.jti, result.userID, {web});
			if (!verify) {
				return;
			}

			return result.userID;
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
			const userID = await this.verify(token, options?.web);
			if (!userID) {
				return;
			}

			const user = await this.#core.db.findUser({userID});
			if (!user) {
				return;
			}

			if (options?.fn && !options.fn(user)) {
				return;
			}

			user.email = this.#core.Utils.decrypt(user.email);
			return user;
		} catch {}
    }

    public async revoke(token: string, web?: boolean): Promise<boolean | void> {
		if (web) {
			token = token.slice(8);
		}

		try {
			const result: any = jwt.verify(token, this.#pubKey, {issuer: 'folderr'});
			if (!result) {
				return;
			}

			const verifyDB = await this.#core.db.purgeToken(result.jti, result.userID, {web});
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
		return `Bearer: ${jwt.sign(
				{userID},
				this.#privKey,
				{
					expiresIn: '14d',
					issuer: 'folderr',
					jwtid: id
				}
			)}`;
    }

    async genKey(userID: string): Promise<string> {
		const id = this.genID();
		await this.#core.db.makeToken(id, userID, {web: false});
		return jwt.sign({userID}, this.#privKey, {issuer: 'folderr', jwtid: id});
    }

    async genMirrorKey(url: string, mirrorURL: string): Promise<{key: string; id: string}> {
		const id = this.genID();
		return {
			key: jwt.sign({
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

    verifyMirrorKey(message: {
		res: string;
		token: string;
	}, id: string, url: string, mirrorURL: string): boolean {
		const out: any = jwt.verify(message.token, this.#privKey, {issuer: 'folderr'});
		if (
			out &&
			typeof out === 'object' &&
			out.jti === id &&
			out.url === url &&
			out.mirrorURL === mirrorURL &&
			message.res === 'Pong! Mirror Operational!'
		) {
			return true;
		}

		return false;
    }

    private genID(): string {
		return `${crypto.randomBytes(10).toString('hex') +
		Buffer.from(new Date().toString()).toString('base64').slice(0, 8)}`;
    }
}

/* eslint-enable @typescript-eslint/indent */
