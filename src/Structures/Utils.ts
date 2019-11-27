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
 * @author VoidNull
 * @version 0.8.0
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User, { Notification, UserI } from '../Schemas/User';
import VerifyingUser, { VUser } from '../Schemas/VerifyingUser';
import { UploadI } from '../Schemas/Image';
import { Short } from '../Schemas/Short';
import { isBoolean, promisify } from 'util';
import { Request } from 'express';
import BearerTokens from '../Schemas/BearerTokens';
import Evolve from './Evolve';
import os from 'os';

const sleep = promisify(setTimeout);

interface TokenReturn {
    token: string;
    hash: string;
}

/**
 * @class Utils
 * @param {Evolve} evolve The Evolve-X client
 *
 * @classdesc Utility functions used for authorization or user generation
 *
 * @author VoidNulll
 */
class Utils {
    public saltRounds: number;

    public byteSize: number;

    private evolve: Evolve | null;

    private defaultShardOptions: { maxCores: number; maxMemory: string; enabled: boolean };

    /**
     * @constructor
     *
     * @prop {number} saltRounds The rounds to salt with
     * @prop {number} byteSize The amount of random bytes to generate
     * @prop {Evolve} evolve The Evolve client
     */
    constructor(evolve: Evolve | null) {
        this.saltRounds = 10;
        this.byteSize = 48;
        this.evolve = evolve;
        this.defaultShardOptions = {
            maxCores: 48,
            enabled: false,
            maxMemory: '4G',
        };
    }

    /**
     * @desc Make Utils look pretty when inspected
     *
     * @returns {string}
     */
    toString(): string {
        return '[Evolve-X Utils]';
    }

    /**
     * @desc Returns a random number between min (inclusive) and max (exclusive)
     *
     * @generator
     *
     * @returns {number}
     */
    genRandomNum(): number {
        return Math.random() * (9);
    }

    /**
     * @desc Wait for a certain time
     * - Async/wait only
     * @async
     *
     * @param {Number} ms The milliseconds to sleep for
     * @returns {Promise<void>}
     * @author KhaaZ
     */
    // Taken from https://github.com/Khaazz/AxonCore/blob/d597089b80615fdd5ceab8f0a1b1d83f70fc5187/src/Utility/Utils.js#L355
    async sleep(ms: number): Promise<void> {
        await sleep(ms);
        return Promise.resolve();
    }

    /**
     * @desc Generate a user ID
     * @generator
     *
     * @returns {Promise<string>}
     */
    genUID(): Promise<string> {
        // Minimum and max id length
        const max = 22;
        const min = 18;
        // What is wut??
        const wut = 1;
        // pick between 18 and 22
        const num = Math.floor(Math.random() * (max - min + wut) ) + min;
        let uID = '';
        // Min and max numbers
        const maxChar = 9;
        const minChar = 1;
        // Generate the user ID
        for (let i = 0; i < num; i++) {
            uID += String(Math.floor(Math.random() * (maxChar - minChar + wut) ) + minChar);
        }
        return Promise.resolve(uID);
    }

    /**
     * @desc Generate a ID
     * @generator
     *
     * @param {object[]} things The things to avoid generating a duplicate ID for
     *
     * @returns {string}
     */
    genID(things: UploadI[] | Short[] ): string {
        // Took this function from stack overflow and modified it to fit its purpose.
        // Generate a random ID
        const radix = 36;
        const min = 0;
        const total = 10;
        const str = Math.random()
            .toString(radix)
            .replace(/[^a-zA-Z0-9]+/g, '')
            .substr(min, total);
        if (things) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            const thing = things.find(aThing => aThing.ID === str);
            if (thing) {
                return this.genID(things);
            }
        }
        return str;
    }

    /**
     * @desc Hash a password
     * @async
     *
     * @param {string} password The password to hash
     * @returns {string}
     */
    hashPass(password: string): Promise<string> {
        // Matthew helped me find bcrypt and use it originally. https://gitlab.libraryofcode.org/matthew
        // Original hasher for things: https://github.com/AxonTeam/cdnAPI/blob/unstable/token/hash.js

        // Minimum and max password lengths
        const minPass = 8;
        const maxPass = 32;
        // If the password is not over min length
        // If password does not match the regex completely
        const match: RegExpMatchArray | null = password.match(/[A-Za-z0-9_.&]/g);
        if (password.length < minPass || (match && match.length !== password.length) ) {
            throw Error('Password must be 8 characters or more long, and be only contain alphanumeric characters as well as `.`, and `&`');
        }
        // If the password is too long
        if (password.length > maxPass) {
            throw Error('Password is too long, password must be under 32 characters long');
        }
        // Hash and return
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * @desc Generate a notification ID
     * @generator
     * @async
     *
     * @param {Object[]} notifs The notifications IDs to ignore
     * @returns {Promise<string|Promise<*>>}
     */
    async genNotifyID(notifs: Notification[] ): Promise<string> {
        // Gen the ID, and dont let the ID equal a already made notify id
        const ID: string = await this.genUID();
        const notify: Notification | undefined = notifs.find(notif => notif.ID === ID);
        if (notify) {
            // Retry if notify exists
            return this.genNotifyID(notifs);
        }
        // Return the ID
        return ID;
    }

    /**
     * @desc Generate a users token
     * @async
     * @generator
     *
     * @param userID
     * @returns {Promise<{hash: string, token: string}>}
     */
    async genToken(userID: string): Promise<TokenReturn> {
        // Source: https://gitlab.libraryofcode.org/matthew

        // Generate random bytes, create buffer from user id
        // Oh and get a base64 date in milliseconds
        const random: string = crypto.randomBytes(this.byteSize).toString('base64')
            .replace(/[+\\]/, '-')
            .replace(/[=/.]/, '_');
        const uID = Buffer.from(userID).toString('base64')
            .replace(/[+\\]/, '-')
            .replace(/[=/.]/, '_');
        const date = Buffer.from(new Date().getUTCMilliseconds().toString() ).toString('base64');
        // Combine, hash, and return the hashed and unhashed token
        const token = `${uID}.${random}.${date}`;
        const hash = await bcrypt.hash(token, this.saltRounds);
        return { token, hash };
    }

    /**
     * @desc Generate a users token
     * @async
     * @generator
     *
     * @param userID
     * @returns {Promise<{hash: string, token: string}>}
     */
    async genBearerToken(userID: string): Promise<TokenReturn> {
        // Original Source: https://gitlab.libraryofcode.org/matthew

        // Generate random bytes, create buffer from user id
        // Oh and get a base64 date in milliseconds
        const random: string = crypto.randomBytes(this.byteSize).toString('base64')
            .replace(/[+\\]/, '-')
            .replace(/[=/.]/, '_');
        const uID = Buffer.from(userID).toString('base64');
        const date = Buffer.from(new Date().getUTCMilliseconds().toString() ).toString('base64');
        // Combine, hash, and return the hashed and unhashed token
        let token = `${date}.${uID}.${random}`;
        const hash = await bcrypt.hash(token, this.saltRounds);
        token = `Bearer:${token}`;
        return { token, hash };
    }

    /**
     * @desc Generate a validation token
     * @generator
     * @async
     *
     * @returns {Promise<{hash: string, token: string}>}
     */
    async genValidationToken(): Promise<TokenReturn> {
        // Generate random bytes, gen more random bytes
        // Oh and get a base64 date in milliseconds
        const random: string = crypto.randomBytes(this.byteSize).toString();
        return this.genToken(random);
    }

    /**
     * @desc Authenticate a user using token and user ID
     * @async
     *
     * @param {Object<Request>} req The request
     * @param {function} [fn] Optional function for auth
     * @returns {Promise<void|UserI>}
     */
    async authToken(req: Request, fn?: (arg0: UserI) => boolean): Promise<UserI|false|string> {
        // Make sure all of the auth stuff is there
        if (!req.headers.uid && !req.headers.token) {
            return '[ERROR] REQUEST TOKEN AUTHORIZATION HEADERS MISSING!';
        } if (!req.headers.uid || !req.headers.token) {
            return '[ERROR] REQUEST TOKEN AUTHORIZATION HEADERS INCOMPLETE!';
        }
        // Make sure the auth is not an array. Arrays are bad for auth
        if (Array.isArray(req.headers.uid) || Array.isArray(req.headers.token) ) {
            return '[ERROR] ARRAY AUTHENTICATION HEADERS NOT ALLOWED!';
        }
        // Find the user via ID, if no user the auth failed

        // Matthew helped with bcrypt & the database part, so he helped with auth.
        // https://gitlab.libraryofcode.org/matthew
        const user = await User.findOne( { uID: req.headers.uid } );
        if (!user) {
            return false;
        }
        // IO tokens do not match, auth failed... Else return user
        if (!bcrypt.compareSync(req.headers.token, user.token) ) {
            return false;
        }

        if (fn) {
            const funcOut = fn(user);
            if (!funcOut || !isBoolean(funcOut) ) {
                return false;
            }
        }

        return user;
    }

    /**
     * @desc Authenticate a user using password and username
     * @async
     *
     * @param {Request} req The express request.
     * @param {Function} [fn] Custom function, if not evaluated to true the auth will fail
     *
     * @returns {Promise<boolean>}
     */
    async authPassword(req: Request, fn?: (arg0: UserI) => boolean): Promise<UserI|false|string> {
        // Make sure all of the auth stuff is there
        if (!req.headers.password && !req.headers.username) {
            return '[ERROR] REQUEST PASSWORD AUTHORIZATION HEADERS MISSING!';
        } if (!req.headers.password || !req.headers.username) {
            return '[ERROR] REQUEST PASSWORD AUTHORIZATION HEADERS INCOMPLETE!';
        }
        // Make sure the auth is not an array. Arrays are bad for auth
        if (Array.isArray(req.headers.password) || Array.isArray(req.headers.username) ) {
            return '[ERROR] ARRAY AUTHENTICATION HEADERS NOT ALLOWED!';
        }
        // Find user on username, and if no user auth failed

        // Matthew helped with bcrypt & the database part, so he helped with auth.
        // https://gitlab.libraryofcode.org/matthew
        const user = await User.findOne( { username: req.headers.username } );
        if (!user) {
            return false;
        }
        // Compare actual password and inputted password. If they do not match, fail
        if (!bcrypt.compareSync(req.headers.password, user.password) ) {
            return false;
        }
        // If the custom function exists
        if (fn) {
            const funcOut = fn(user); // Run the custom function
            if (!funcOut || !isBoolean(funcOut) ) { // If the custom function does not output true, return false
                return false;
            }
        }
        // Return the user
        return user;
    }

    /**
     * @desc Authorize for the bearer token
     * @async
     *
     * @param {Object} obj Object containing the token & uid
     * @param {Function} [fn] Custom function, if not evaluated to true the auth will fail
     *
     * @returns {Promise<boolean|UserI|string>}
     */
    async authBearerToken(obj: any, fn?: (arg0: UserI) => boolean): Promise<UserI|false|string> {
        if (!obj.token) {
            return '[ERROR] REQUEST AUTHORIZATION MISSING!';
        }
        // Make sure the auth is not an array. Arrays are bad for auth
        if (Array.isArray(obj.token) ) {
            return '[ERROR] ARRAY AUTHENTICATION NOT ALLOWED!';
        }
        // Find the user
        const token = obj.token.slice('Bearer:'.length);
        const tkn = token.split('.');
        if (!tkn || !tkn[1] ) {
            return '[ERROR] INVALID TOKEN!';
        }
        const id = Buffer.from(tkn[1], 'base64').toString('utf8');
        // Modified version of https://gitlab.com/evolve-x/evolve-x/blob/master/src/Structures/Utils.ts#L220
        const user = await User.findOne( { uID: id } );
        // If the user has no tokens, or if the user cannot be found
        if (!user) {
            return false;
        }
        const tokens = await BearerTokens.find( { uID: id } );
        if (!tokens || tokens.length === 0) {
            return false;
        }
        // Make the token actually useable, since the tokens have "Bearer: " in front
        let success;
        // Check if one of the tokens matches the given token
        for (const dbtoken of tokens) {
            if (bcrypt.compareSync(token, dbtoken.token) ) {
                success = true;
                break;
            }
        }
        // If the tokens don't match.. night night
        if (!success) {
            return false;
        }
        if (fn) {
            const funcOut = fn(user); // Run the custom function
            if (!funcOut || !isBoolean(funcOut) ) { // If the custom function does not output true, return false
                return false;
            }
        }

        return user;
    }

    /**
     * @desc Authenticate a user using token and user ID via Body
     * @async
     *
     * @param {Object<Request>} req The request
     * @param {function} [fn] Optional function for auth
     *
     * @returns {Promise<void|UserI>}
     */
    async authTokenBody(req: Request, fn?: (arg0: UserI) => boolean): Promise<UserI|false|string> {
        // Modified version of https://gitlab.com/evolve-x/evolve-x/blob/master/src/Structures/Utils.ts#L220

        // Make sure all of the auth stuff is there
        if (!req.body.uid && !req.body.token) {
            return '[ERROR] REQUEST TOKEN AUTHORIZATION MISSING!';
        } if (!req.body.uid || !req.body.token) {
            return '[ERROR] REQUEST TOKEN AUTHORIZATION INCOMPLETE!';
        }
        // Make sure the auth is not an array. Arrays are bad for auth
        if (Array.isArray(req.body.uid) || Array.isArray(req.body.token) ) {
            return '[ERROR] ARRAY AUTHENTICATION NOT ALLOWED!';
        }
        // Find the user via ID, if no user the auth failed
        const user = await User.findOne( { uID: req.body.uid } );
        if (!user) {
            return false;
        }
        // IO tokens do not match, auth failed... Else return user
        if (!bcrypt.compareSync(req.body.token, user.token) ) {
            return false;
        }

        if (fn) {
            const funcOut = fn(user);
            if (!funcOut || !isBoolean(funcOut) ) {
                return false;
            }
        }

        return user;
    }

    /**
     * @desc Authenticate a user using password and username
     * @async
     *
     * @param {Request} req The express request.
     * @param {Function} [fn] Custom function, if not evaluated to true the auth will fail
     *
     * @returns {Promise<boolean>}
     */
    async authPasswordBody(req: Request, fn?: (arg0: UserI) => boolean): Promise<UserI|false|string> {
        // Modified version of https://gitlab.com/evolve-x/evolve-x/blob/master/src/Structures/Utils.ts#L259

        // Make sure all of the auth stuff is there
        if (!req.body.password && !req.body.username) {
            return '[ERROR] REQUEST PASSWORD AUTHORIZATION HEADERS MISSING!';
        } if (!req.body.password || !req.body.username) {
            return '[ERROR] REQUEST PASSWORD AUTHORIZATION HEADERS INCOMPLETE!';
        }
        // Make sure the auth is not an array. Arrays are bad for auth
        if (Array.isArray(req.body.password) || Array.isArray(req.body.username) ) {
            return '[ERROR] ARRAY AUTHENTICATION HEADERS NOT ALLOWED!';
        }
        // Find user on username, and if no user auth failed
        const user = await User.findOne( { username: req.body.username } );
        if (!user) {
            return false;
        }
        // Compare actual password and inputted password. If they do not match, fail
        if (!bcrypt.compareSync(req.body.password, user.password) ) {
            return false;
        }
        // If the custom function exists
        if (fn) {
            const funcOut = fn(user); // Run the custom function
            if (!funcOut || !isBoolean(funcOut) ) { // If the custom function does not output true, return false
                return false;
            }
        }
        // Return the user
        return user;
    }

    /**
     * @desc Determines if the user allows insecuce requests
     * @param req ExpressJS request
     *
     * @returns {boolean}
     */
    verifyInsecureCookies(req: any): boolean {
        if (!req.cookies) {
            return false;
        }
        if (!req.cookies.i) {
            return false;
        }
        if (req.cookies.i !== 't') {
            return false;
        }
        return true;
    }

    /**
     * @desc Find and return a verifying user from the schema if any
     * @async
     *
     * @param {String} validationToken The validation token to search for
     * @param {String} userID The user IDs to look for
     * @returns {Promise<boolean>}
     */
    async findVerifying(validationToken: string, userID: string): Promise<VUser|false> {
        const user: VUser | null = await VerifyingUser.findOne( { uID: userID } );
        // original bcrypt validation code i used: https://github.com/AxonTeam/cdnAPI/blob/unstable/token/checkHash.js
        // Originally made by matthew: https://gitlab.libraryofcode.org/matthew
        if (!user) {
            return false;
        }
        if (!bcrypt.compareSync(validationToken, user.validationToken) ) {
            return false;
        }
        return user;
    }

    /**
     * @desc Handles cookie authentication to smooth the process
     * @borrows {Utils.authBearerToken}
     * @async
     *
     * @param req ExpresssJS request object
     * @param res ExpressJS response object (to set/clear cookies)
     * @param [cb] {function} hi
     *
     * @returns {Promise<UserI | *>}
     */
    async authCookies(req: any, res: any, cb?: (arg0: UserI) => boolean): Promise<UserI | void | any> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        this.evolve.Session.removeIfNeeded(req, res);
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const fa1 = this.evolve.Session.fetchSession(req);
        if (fa1) {
            if (cb) {
                // eslint-disable-next-line callback-return
                const funcOut = cb(fa1);
                if (!funcOut || !isBoolean(funcOut) ) {
                    return false;
                }
            }
            return fa1;
        }
        if (req.cookies && req.cookies.token && req.cookies.token.startsWith('Bearer:') ) {
            const fa2 = this.authBearerToken(req.cookies, cb);
            if (fa2) {
                return fa2;
            }
        }
        return false;
    }

    /**
     * @desc Handle checking if cookies for authentication exist or not.
     *
     * @param req The expressjs request
     *
     * @returns {boolean}
     */
    checkCookies(req: any): boolean {
        if (!req.cookies) {
            return false;
        }
        if (!req.cookies.token && !req.cookies.sid) {
            return false;
        }
        if (req.cookies.token && !req.cookies.token.startsWith('Bearer') ) {
            return false;
        }
        return true;
    }

    ramConverter(amount: string) {
        if (amount.toLowerCase().match(/gg|g/) ) { // If the RAM amount is in GB
            return Math.round(Number(amount.replace(/gb|g/gi, '') ) * 1000);
        } if (amount.toLowerCase().match(/mb|m/) ) { // If the amount is in MB, convert with MB
            return Math.round(Number(amount.replace(/mb|m/gi, '') ) );
        }
        throw Error('[SHARDER] - Invalid memory amount');
    }

    shardLimit(sharderOptions = this.defaultShardOptions) {
        if (!sharderOptions.enabled) {
            return false;
        }

        const toBytes = 1048576;

        const max = (sharderOptions.maxCores > this.defaultShardOptions.maxCores) ? this.defaultShardOptions.maxCores : sharderOptions.maxCores;

        const maxRAM = Number( (os.totalmem() / toBytes).toFixed(0) );

        const ram = this.ramConverter(sharderOptions.maxMemory || this.defaultShardOptions.maxMemory) > maxRAM ? maxRAM : this.ramConverter(sharderOptions.maxMemory || this.defaultShardOptions.maxMemory);

        const leftForOS = 2; // CPU cores left for the operating system.

        const maxCPUs = os.cpus().length > 3 ? os.cpus().length - leftForOS : os.cpus().length; // Leave some cores for the OS if there is at least 4 CPU cores on the OS

        console.log(maxCPUs);
        console.log(max);
        const processRamMB = 180; // The amount of RAM I estimate the process to use.
        const ramLimit = Math.floor(ram / processRamMB); // Total RAM divided by ESTIMATED RAM usage per 6 user process.
        if (max > maxCPUs || ramLimit > maxCPUs) {
            console.log(max > maxCPUs ? 'WHY' : 'ok');
            return maxCPUs;
        }
        if (ramLimit > max) {
            return max;
        }
        return ramLimit;
    }
}

export default Utils;
