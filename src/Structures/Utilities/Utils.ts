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

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User as UI, PendingMember } from '../Database/DBClass';
import FoldCodes, { FoldCodes as IFoldCodes } from './FoldCodes';
import { promisify } from 'util';
import { Request } from 'express';
import Folderr from '../Folderr';
import os from 'os';
import Base from '../Base';
import Authorization from './Authorization';
import config from '../../../config.json';
import FolderrConfig from '../Folderr-Config';

const aConfig = new FolderrConfig(config);

const sleep = promisify(setTimeout);

interface TokenReturn {
    token: string;
    hash: string;
}

/**
 * @param {Folderr} folderr The Folderr-X client
 *
 * @classdesc A lot of utility functions
 */
class Utils {
    public saltRounds: number;

    public byteSize: number;

    private folderr: Folderr;

    private defaultShardOptions: { maxCores: number; enabled: boolean };

    private base?: Base;

    public authorization: Authorization;

    public FoldCodes: IFoldCodes;

    /**
     * @constructor
     *
     * @prop {number} saltRounds The rounds to salt with
     * @prop {number} byteSize The amount of random bytes to generate
     * @prop {Folderr} folderr The Folderr client
     */
    constructor(folderr: Folderr, base?: Base) {
        this.saltRounds = 10;
        this.byteSize = 48;
        this.folderr = folderr;
        this.base = base;
        this.defaultShardOptions = {
            maxCores: 48,
            enabled: false,
        };
        this.authorization = new Authorization(aConfig.auth, folderr);
        this.FoldCodes = FoldCodes;
    }

    /**
     * @desc Make Utils look pretty when inspected
     *
     * @returns {string}
     */
    toString(): string {
        return '[Folderr-X Utils]';
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
    genID(): string {
        // Generate a random ID
        const radix = 36;
        const min = 0;
        const total = 10;
        const str = Math.random()
            .toString(radix)
            .replace(/[^a-zA-Z0-9]+/g, '')
            .substr(min, total);
        let toReturn = true;
        Promise.all( [this.folderr.base.db.findFile( { ID: str }, 'ID'), this.folderr.base.db.findLink( { ID: str }, 'ID')] ).then( ( [Uploaded, Lin] ) => {
            if (Uploaded || Lin) {
                toReturn = false;
            }
        } );
        if (!toReturn) {
            return this.genID();
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
        // Minimum and max password lengths
        const minPass = 8;
        const maxPass = 32;
        // If the password is not over min length
        // If password does not match the regex completely
        const match: RegExpMatchArray | null = password.match(this.folderr.regexs.password);
        if (password.length < minPass || (match && match.length !== password.length) ) {
            throw Error('[PSW1] Password must be 8 characters or more long, and be only contain alphanumeric characters as well as `.`, and `&`');
        }
        // If the password is too long
        if (password.length > maxPass) {
            throw Error('[PSW2] Password is too long, password must be under 32 characters long');
        }
        if (password.match('\0') ) {
            throw Error('[PSW3] NUL character detected! Invalid password!');
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
    async genNotifyID(): Promise<string> {
        // Gen the ID, and dont let the ID equal a already made notify id
        const ID: string = await this.genUID();
        const notify = await this.folderr.base.db.findAdminNotify( { ID } );
        if (notify) {
            // Retry if notify exists
            return this.genNotifyID();
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
     * @desc Generate a validation token
     * @generator
     * @async
     *
     * @returns {Promise<{hash: string, token: string}>}
     */
    async genValidationToken(): Promise<TokenReturn> {
        // Generate random bytes, gen more random bytes
        // Oh and get a base64 date in milliseconds
        const r: string = crypto.randomBytes(this.byteSize).toString();
        const random: string = crypto.randomBytes(this.byteSize).toString('base64')
            .replace(/[`#%"<>|^=/.?:@&+\\-]/g, '_');
        const uID = Buffer.from(r).toString('base64')
            .replace(/[`#%"<>|^=/.?:@&+\\-]/g, '_');
        const date = Buffer.from(new Date().getUTCMilliseconds().toString() ).toString('base64')
            .replace(/[`#%"<>|^=/.?:@&+\\-]/g, '_');
        // Combine, hash, and return the hashed and unhashed token
        const token = `${uID}.${random}.${date}`;
        const hash = await bcrypt.hash(token, this.saltRounds);
        return { token, hash };
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
    async authPassword(req: Request, fn?: (arg0: UI) => boolean): Promise<UI|false> {
        // Make sure all of the auth stuff is there
        if (!req.headers.password && !req.headers.username) {
            return false;
        } if (!req.headers.password || !req.headers.username) {
            return false;
        }
        // Make sure the auth is not an array. Arrays are bad for auth
        if (Array.isArray(req.headers.password) || Array.isArray(req.headers.username) ) {
            return false;
        }
        // Find user on username, and if no user auth failed

        const user = await this.folderr.base.db.findUser( { username: req.headers.username } );
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
            if (!funcOut || !(typeof funcOut === 'boolean') ) { // If the custom function does not output true, return false
                return false;
            }
        }
        user.email = this.decrypt(user.email);
        // Return the user
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
    async authPasswordBody(req: Request, fn?: (arg0: UI) => boolean): Promise<UI|false> {
        // Modified version of https://gitlab.com/evolve-x/evolve-x/blob/master/src/Structures/Utils.ts#L259

        // Make sure all of the auth stuff is there
        if (!req.body.password && !req.body.username) {
            return false;
        } if (!req.body.password || !req.body.username) {
            return false;
        }
        // Make sure the auth is not an array. Arrays are bad for auth
        if (Array.isArray(req.body.password) || Array.isArray(req.body.username) ) {
            return false;
        }
        // Find user on username, and if no user auth failed
        const user = await this.folderr.base.db.findUser( { username: req.body.username } );
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
            if (!funcOut || !(typeof funcOut === 'boolean') ) { // If the custom function does not output true, return false
                return false;
            }
        }
        user.email = this.decrypt(user.email);
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
        if (this.base && this.base.options && this.base.options.security.disableInsecure) {
            return true;
        }
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
    async findVerifying(validationToken: string, userID: string): Promise<PendingMember|false> {
        const user: PendingMember | undefined | null = await this.folderr.base.db.findVerify( { userID } );
        if (!user) {
            return false;
        }
        if (!bcrypt.compareSync(validationToken, user.validationToken) ) {
            return false;
        }
        return user;
    }

    ramConverter(amount: string): number {
        if (amount.toLowerCase().match(/gg|g/) ) { // If the RAM amount is in GB
            return Math.round(Number(amount.replace(/gb|g/gi, '') ) * 1000);
        } if (amount.toLowerCase().match(/mb|m/) ) { // If the amount is in MB, convert with MB
            return Math.round(Number(amount.replace(/mb|m/gi, '') ) );
        }
        throw Error('[SHARDER] - Invalid memory amount');
    }

    shardLimit(sharderOptions = this.defaultShardOptions): number | boolean {
        if (!sharderOptions.enabled) {
            return false;
        }

        const leftForOS = 2; // CPU cores left for the operating system.

        const cpus = os.cpus();
        return sharderOptions.maxCores > cpus.length - leftForOS ? cpus.length - leftForOS : sharderOptions.maxCores;
    }

    async testMirrorURL(url: string): Promise<boolean> {
        try {
            const test = await this.folderr.base.superagent.get(`${url}/api`);
            if (test?.text && JSON.parse(test?.text)?.message?.res === 'Pong! Mirror Operational!') {
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    async determineHomeURL(req: Request): Promise<string> {
        const protocol = `${req.protocol || 'http'}://`;
        try {
            const test = await this.folderr.base.superagent.get(`${this.folderr.base.options.url}/api`);
            if (test?.text && JSON.parse(test?.text)?.message?.message === 'Pong!') {
                return this.folderr.base.options.url;
            }
            return `${protocol}${req.get('host')}`;
        } catch (e) {
            return `${protocol}${req.get('host')}`;
        }
    }

    hash(email: string): string {
        return crypto.createHash('sha512').update(email).digest('hex');
    }

    encrypt(data: string): string {
        return Buffer.from(data, 'utf8').toString('hex');
    }

    decrypt(data: string): string {
        return Buffer.from(data, 'hex').toString('utf8');
    }
}

export default Utils;
