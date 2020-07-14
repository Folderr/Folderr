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
import { promises as fs } from 'fs';
import crypto from 'crypto';
import Folderr from '../Folderr';
import { User } from '../Database/DBClass';

interface Keys {
    privKeyPath: string;
    algorithm?: string;
    pubKeyPath: string;
}

/**
 * @classdesc Handle token authorization.
 */
export default class Authorization {
    public secret: string | Keys;

    private _privKey?: Buffer;

    private _pubKey?: Buffer;

    private readonly _secretStr: string;

    public folderr: Folderr;

    constructor(secret: string | Keys, folderr: Folderr) {
        this.secret = secret;
        this._secretStr = '';
        if (typeof this.secret === 'object') {
            if (!this.secret.algorithm) {
                this.secret.algorithm = 'RS256';
            }
        } else {
            this._secretStr = this.secret;
        }
        this.folderr = folderr;


        this._init().then(r => r);
    }

    public async verify(token: string, web?: boolean): Promise<string | void> {
        if (web) {
            token = token.substring(8);
        }
        try {
            const result: any = jwt.verify(token, this._getKey().public, { issuer: 'folderr' } );
            if (!result) {
                return;
            }
            const verify = await this.folderr.base.db.findToken(result.jti, result.userID, { web } );
            if (!verify) {
                return;
            }
            return result.userID;
        } catch (e) {
            return;
        }
    }

    public async verifyAccount(token?: string | string[], options?: { fn?: (args0: User) => boolean; web?: boolean } ): Promise<User | void> {
        if (!token) {
            return;
        }
        if (Array.isArray(token) ) {
            return;
        }
        try {
            const userID = await this.verify(token, (options && options.web) );
            if (!userID) {
                return;
            }
            const user = await this.folderr.base.db.findUser( { userID } );
            if (!user) {
                return;
            }
            if (options && options.fn && !options.fn(user) ) {
                return;
            }
            user.email = this.folderr.base.Utils.decrypt(user.email);
            return user;
        } catch (e) {
            return;
        }
    }

    public async revoke(token: string, web?: boolean): Promise<boolean | void> {
        if (web) {
            token = token.substring(8);
        }
        try {
            const res: any = jwt.verify(token, this._getKey().public, { issuer: 'folderr' } );
            if (!res) {
                return;
            }
            const verifyDB = await this.folderr.base.db.purgeToken(res.jti, res.userID, { web } );
            if (!verifyDB) {
                return;
            }
            return true;
        } catch (e) {
            return;
        }
    }

    public async revokeAll(userID: string): Promise<boolean | void> {
        try {
            const del = await this.folderr.base.db.purgeTokens(userID);
            if (!del || del === 0) {
                return;
            }
            this.folderr.base.logger.verbose(`[DB] Deleted ${del} Authorization Tokens`);
            return true;
        } catch (e) {
            return;
        }
    }

    async genKeyWeb(userID: string): Promise<string> {
        const id = this._genID();
        await this.folderr.base.db.makeToken(id, userID, { web: true } );
        const key = this._getKey();
        return `Bearer: ${jwt.sign( { userID }, key.private, { expiresIn: '14d', issuer: 'folderr', jwtid: id } )}`;
    }

    async genKey(userID: string): Promise<string> {
        const key = this._getKey();
        const id = this._genID();
        await this.folderr.base.db.makeToken(id, userID, { web: false } );
        return jwt.sign( { userID }, key.private, { issuer: 'folderr', jwtid: id } );
    }

    async genMirrorKey(url: string, mirrorURL: string): Promise<{ key: string; id: string }> {
        const key = this._getKey();
        const id = this._genID();
        return { key: jwt.sign( { url, mirrorURL }, key.private, { issuer: 'folderr', jwtid: id, expiresIn: '1h' } ), id };
    }

    verifyMirrorKey(message: { res: string; token: string }, id: string, url: string, mirrorURL: string): boolean {
        const key = this._getKey();
        const out: any = jwt.verify(message.token, key.private, { issuer: 'folderr' } );
        if (out && typeof out === 'object' && out.jti === id && out.url === url && out.mirrorURL === mirrorURL && message.res === 'Pong! Mirror Operational!') {
            return true;
        }
        return false;
    }

    private _genID() {
        return `${crypto.randomBytes(10).toString('hex') + Buffer.from(new Date().toString() ).toString('base64').substring(0, 8)}`;
    }

    public async _init(): Promise<void> {
        if (typeof this.secret == 'object') {
            this._privKey = await fs.readFile(this.secret.privKeyPath);
            this._pubKey = await fs.readFile(this.secret.pubKeyPath);
        }
    }

    private _getKey(): { private: string | Buffer; public: string | Buffer; algorithm: string } {
        if (typeof this.secret == 'object' && this._privKey && this._pubKey) {
            return { private: this._privKey, public: this._pubKey, algorithm: this.secret.algorithm || 'RS256' };
        }
        return { private: this._secretStr, public: this._secretStr, algorithm: 'RS256' };
    }
}
