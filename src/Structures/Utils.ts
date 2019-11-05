import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User, { Notification, UserI } from '../Schemas/User';
import VerifyingUser, { VUser } from '../Schemas/VerifyingUser';
import { ImageI } from '../Schemas/Image';
import { Short } from '../Schemas/Short';
import { isBoolean, promisify } from 'util';
import { Request } from 'express';
import BearerTokens from '../Schemas/BearerTokens';
import Evolve from "./Evolve";

const sleep = promisify(setTimeout);

interface TokenReturn {
    token: string;
    hash: string;
}

/**
 * @class Utils
 *
 * @author Null#0515
 */
class Utils {
    public saltRounds: number;

    public byteSize: number;
    private evolve: Evolve | null;

    /**
     * @prop {Number} saltRounds The rounds to salt with
     * @prop {Number} byteSize The amount of random bytes to generate
     */
    constructor(evolve: Evolve | null) {
        this.saltRounds = 10;
        this.byteSize = 48;
        this.evolve = evolve;
    }

    /**
     * @returns {string}
     */
    toString(): string {
        return '[Evolve-X Utils]';
    }

    /**
     * Returns a random number between min (inclusive) and max (exclusive)
     *
     * @returns {Number}
     */
    genRandomNum(): number {
        return Math.random() * (9);
    }

    /**
     * Wait for a certain time
     * - Async/wait only
     *
     * @param {Number} ms The milliseconds to sleep for
     * @returns {Promise<void>}
     */
    async sleep(ms: number): Promise<void> {
        await sleep(ms);
        return Promise.resolve();
    }

    /**
     * Generate a user ID
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
     * Generate a ID
     *
     * @param {Object[]} things The things to avoid generating a duplicate ID for
     *
     * @returns {String}
     */
    genID(things: ImageI[] | Short[] ): string {
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
     * Hash a password
     *
     * @param {String} password The password to hash
     * @returns {String}
     */
    hashPass(password: string): Promise<string> {
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
     * Generate a notification ID
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
     * Generate a users token
     *
     * @param userID
     * @returns {Promise<{hash: *, token: *}>}
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
     * Generate a users token
     *
     * @param userID
     * @returns {Promise<{hash: *, token: *}>}
     */
    async genBearerToken(userID: string): Promise<TokenReturn> {
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
     * Generate a validation token
     *
     * @returns {Promise<{hash: String, token: String}>}
     */
    async genValidationToken(): Promise<TokenReturn> {
        // Generate random bytes, gen more random bytes
        // Oh and get a base64 date in milliseconds
        const random: string = crypto.randomBytes(this.byteSize).toString();
        return this.genToken(random);
    }

    /**
     * Authenticate a user using token and user ID
     *
     * @param {Object<Request>} req The request
     * @param {function} [fn] Optional function for auth
     * @returns {Promise<void|Object>}
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
     * Authenticate a user using password and username
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
     * Authorize for the bearer token
     *
     * @param {Object} obj Object containing the token & uid
     * @param {Function} [fn] Custom function, if not evaluated to true the auth will fail
     *
     * @returns {Promise<Boolean|UserI|String>}
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
     * Authenticate a user using token and user ID via Body
     *
     * @param {Object<Request>} req The request
     * @param {function} [fn] Optional function for auth
     * @returns {Promise<void|Object>}
     */
    async authTokenBody(req: Request, fn?: (arg0: UserI) => boolean): Promise<UserI|false|string> {
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
     * Authenticate a user using password and username
     *
     * @param {Request} req The express request.
     * @param {Function} [fn] Custom function, if not evaluated to true the auth will fail
     *
     * @returns {Promise<boolean>}
     */
    async authPasswordBody(req: Request, fn?: (arg0: UserI) => boolean): Promise<UserI|false|string> {
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
     * Find and return a verifying user from the schema if any
     *
     * @param {String} validationToken The validation token to search for
     * @param {String} userID The user IDs to look for
     * @returns {Promise<boolean>}
     */
    async findVerifying(validationToken: string, userID: string): Promise<VUser|false> {
        const user: VUser | null = await VerifyingUser.findOne( { uID: userID } );
        if (!user) {
            return false;
        }
        if (!bcrypt.compareSync(validationToken, user.validationToken) ) {
            return false;
        }
        return user;
    }

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

    checkCookies(req: any) {
        if (!req.cookies) {
            return false;
        }
        if (!req.cookies.token && !req.cookies.sid) {
            return false;
        }
        if (req.cookies.token && req.cookies.token.startsWith('Bearer') ) {
            return false;
        }
        return true;
    }
}

export default Utils;
