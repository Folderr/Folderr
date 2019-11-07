/**
 * @license
 *
 * Evolve-X is an open source image host. https://gitlab.com/evolve-x
 * Copyright (C) 2019 VoidNulll
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
 * @author VoidNulll
 * @version 0.8.0
 */

/* eslint no-magic-numbers: "off"*/
/* eslint @typescript-eslint/ban-ts-ignore: "off" */
import crypto from 'crypto';

export interface Options {
    bytes?: number;
    expiresAfter?: number;
}

export interface CookieReturns {
    cookieID: string;
    maxAge: Date;
}

/**
 * @class EvolveSession
 *
 * @classdesc Handles 1 day sessions (cookies) for the frontend.
 *
 * @author VoidNulll
 */
class EvolveSession implements Options {
    public bytes: number;

    public sessions: Map<string, object>;

    public expiresAfter: number;

    /**
     * @desc Handles sessions
     * @param options {Options} The session options
     *
     * @prop bytes {number} How many bytes to randomly generate
     * @prop sessions {Map} A map of sessions in memory
     * @prop expiresAfter {number} How long the session lasts in milliseconds
     */
    constructor(options?: Options) {
        this.bytes = options && options.bytes ? options.bytes : 32;
        this.sessions = new Map();
        this.expiresAfter = options && options.expiresAfter && !Number.isNaN(options.expiresAfter) ? options.expiresAfter : 86400000;
    }

    /**
     * @desc Sets the session cookie
     * @param res The ExpressJS response
     *
     * @returns {CookieReturns}
     */
    setCookie(res: any): CookieReturns {
        const cookieID = this.generateID();
        res.cookie('sid', cookieID, { secure: false, sameSite: 'Strict', maxAge: this.expiresAfter, path: '/' } );
        return { cookieID, maxAge: new Date(Date.now() + this.expiresAfter) };
    }

    /**
     * @desc Generate a session ID
     * @generator
     * @returns {string}
     */
    generateID(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * @desc Create a new session
     *
     * @param data {UserI} Users data
     * @param req ExpressJS Request object
     * @param res ExpressJS result/response object
     */
    newSession(data: object, req: any, res: any): void {
        if (req.cookies && req.cookies.sid && this.sessions.get(req.cookies.sid) ) {
            return;
        }
        const cookie = this.setCookie(res);
        const d = data;
        // @ts-ignore
        d.expires = cookie.maxAge;
        // @ts-ignore
        d.sid = cookie.cookieID;
        this.sessions.set(cookie.cookieID, d);
    }

    /**
     * @desc Remove a session from memory
     * @param sid {string} The session ID to remove
     */
    removeData(sid: string): void {
        if (!this.sessions.get(sid) ) {
            return;
        }
        this.sessions.delete(sid);
    }

    /**
     * @desc Remove a session from browser and from the session client
     * @param req ExpressJS Request
     * @param res ExpressJS Response
     */
    removeSession(req: any, res: any): void {
        if (!req.cookies || !req.cookies.sid) {
            return;
        }
        const data = this.sessions.get(req.cookies.sid);
        if (!data) {
            return;
        }
        res.clearCookie('sid', { secure: false, sameSite: 'Strict', path: '/' } );
        // @ts-ignore
        this.removeData(data.sid);
    }

    /**
     * @desc Remove the session if the new date is past when the cookie should expire.
     * @param req ExpressJS request
     * @param res ExpressJS response
     */
    removeIfNeeded(req: any, res: any): void {
        if (!req.cookies || !req.cookies.sid) {
            return;
        }
        const data = this.sessions.get(req.cookies.sid);
        if (!data) {
            return;
        }
        // @ts-ignore
        if (new Date() > data.expires) {
            this.removeSession(req, res);
        }
    }

    /**
     * @desc Fetch a sessions user data
     *
     * @param req ExpressJS request to fetch from
     */
    fetchSession(req: any): any {
        if (!req.cookies || !req.cookies.sid) {
            return false;
        }
        const data = this.sessions.get(req.cookies.sid);
        if (!data) {
            return false;
        }
        return data;
    }
}

export default EvolveSession;
